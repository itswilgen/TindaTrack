import {
  AlertCircle,
  Barcode,
  Camera,
  CheckCircle2,
  Flashlight,
  Keyboard,
  LoaderCircle,
  RefreshCw,
  SwitchCamera,
  X,
} from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  isSupportedBarcode,
  normalizeBarcode,
} from "../services/productService";

export type BarcodeScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
};

type ScannerStatus = "idle" | "requesting" | "scanning" | "success";
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type FocusCapabilities = MediaTrackCapabilities & { focusMode?: string[] };
type FocusConstraintSet = MediaTrackConstraintSet & { focusMode?: string };

const ENVIRONMENT_CAMERA_ID = "environment-camera";
const barcodeReaderModules = Promise.all([
  import("@zxing/browser"),
  import("@zxing/library"),
]);

async function createBarcodeReader() {
  const [{ BarcodeFormat, BrowserMultiFormatReader }, { DecodeHintType }] =
    await barcodeReaderModules;
  const possibleFormats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
    BarcodeFormat.QR_CODE,
  ];
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, possibleFormats);
  hints.set(DecodeHintType.TRY_HARDER, true);

  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 60,
    delayBetweenScanSuccess: 0,
    tryPlayVideoTimeout: 8_000,
  });
}

function cameraErrorMessage(error: unknown) {
  const name = String((error as { name?: string })?.name || "");
  const message = String(
    (error as { message?: string })?.message || error || "",
  );
  const fingerprint = `${name} ${message}`.toLowerCase();

  if (
    fingerprint.includes("notallowed") ||
    fingerprint.includes("permission") ||
    fingerprint.includes("denied")
  ) {
    return "Camera permission was denied. Allow camera access in your browser settings and try again.";
  }

  if (
    fingerprint.includes("notfound") ||
    fingerprint.includes("requested device not found")
  ) {
    return "No camera is available on this device.";
  }

  if (
    fingerprint.includes("notreadable") ||
    fingerprint.includes("could not start video source")
  ) {
    return "The camera is busy or unavailable. Close other camera apps and try again.";
  }

  return "The camera could not start. Check your browser permission and try again.";
}

function stopVideoTracks(video: HTMLVideoElement | null) {
  if (!video) return;
  const stream = video.srcObject;
  if (!(stream instanceof MediaStream)) return;

  stream.getTracks().forEach((track) => track.stop());
  video.srcObject = null;
}

function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode",
}: BarcodeScannerModalProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [isPhotoScanning, setIsPhotoScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<IScannerControls | undefined>(undefined);
  const currentDeviceIdRef = useRef("");
  const lastDetectedRef = useRef("");
  const onCloseRef = useRef(onClose);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onCloseRef.current = onClose;
    onScanRef.current = onScan;
  }, [onClose, onScan]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setDevices([]);
      setActiveDeviceId("");
      setManualBarcode("");
      setStatus("idle");
      setError("");
      setSuccess("");
      setTorchSupported(false);
      setTorchEnabled(false);
      setIsPhotoScanning(false);
      currentDeviceIdRef.current = "";
      lastDetectedRef.current = "";
      return;
    }

    if (!window.isSecureContext) {
      setError("Camera access requires HTTPS or localhost.");
      return;
    }

    if (!window.navigator.mediaDevices?.getUserMedia) {
      setError("Camera scanning is not supported by this browser.");
      return;
    }

    setStatus("requesting");
    setError("");
    setActiveDeviceId(ENVIRONMENT_CAMERA_ID);
  }, [cameraAttempt, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeDeviceId || !videoRef.current) return;

    const videoElement = videoRef.current;
    let cancelled = false;
    let controls: IScannerControls | undefined;

    async function startScanner() {
      try {
        setStatus("requesting");
        setError("");
        setSuccess("");
        setTorchSupported(false);
        setTorchEnabled(false);
        lastDetectedRef.current = "";

        const reader = await createBarcodeReader();
        if (cancelled) return;

        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, max: 30 },
          ...(activeDeviceId === ENVIRONMENT_CAMERA_ID
            ? { facingMode: { ideal: "environment" } }
            : { deviceId: { exact: activeDeviceId } }),
        };

        controls = await reader.decodeFromConstraints(
          { video: videoConstraints, audio: false },
          videoElement,
          (result, _decodeError, scannerControls) => {
            if (!result || cancelled) return;

            const barcode = normalizeBarcode(result.getText());
            if (!barcode || barcode === lastDetectedRef.current) return;
            if (!isSupportedBarcode(barcode)) {
              setError("The detected barcode contains unsupported characters.");
              return;
            }

            lastDetectedRef.current = barcode;
            scannerControls.stop();
            stopVideoTracks(videoElement);
            setStatus("success");
            setSuccess(`Barcode ${barcode} detected.`);
            window.navigator.vibrate?.(80);
            onScanRef.current(barcode);
            onCloseRef.current();
          },
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setStatus("scanning");

        const stream = videoElement.srcObject;
        const videoTrack =
          stream instanceof MediaStream
            ? stream.getVideoTracks()[0]
            : undefined;
        currentDeviceIdRef.current =
          videoTrack?.getSettings().deviceId || activeDeviceId;

        const allDevices =
          await window.navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          setDevices(
            allDevices.filter((device) => device.kind === "videoinput"),
          );
        }

        const capabilities = videoTrack?.getCapabilities() as
          | TorchCapabilities
          | undefined;
        setTorchSupported(Boolean(capabilities?.torch && controls.switchTorch));

        const focusCapabilities = capabilities as FocusCapabilities | undefined;
        if (videoTrack && focusCapabilities?.focusMode?.includes("continuous")) {
          const continuousFocus: FocusConstraintSet = {
            focusMode: "continuous",
          };
          try {
            await videoTrack.applyConstraints({ advanced: [continuousFocus] });
          } catch {
            // The scan loop still works when a browser rejects focus controls.
          }
        }
      } catch (scannerError) {
        if (cancelled) return;
        setStatus("idle");
        setError(cameraErrorMessage(scannerError));
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      controls?.stop();
      controlsRef.current = undefined;
      stopVideoTracks(videoElement);
    };
  }, [activeDeviceId, isOpen]);

  useEffect(
    () => () => {
      controlsRef.current?.stop();
      stopVideoTracks(videoRef.current);
    },
    [],
  );

  function returnBarcode(rawBarcode: string) {
    if (status === "success") return;

    const barcode = normalizeBarcode(rawBarcode);

    if (!barcode) {
      setError("Enter a barcode first.");
      return;
    }

    if (!isSupportedBarcode(barcode)) {
      setError(
        "Use only letters, numbers, dots, slashes, colons, plus signs, or hyphens.",
      );
      return;
    }

    controlsRef.current?.stop();
    stopVideoTracks(videoRef.current);
    setError("");
    setStatus("success");
    setSuccess(`Barcode ${barcode} is ready.`);

    onScanRef.current(barcode);
    onCloseRef.current();
  }

  async function scanBarcodePhoto(file: File | undefined) {
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    try {
      setIsPhotoScanning(true);
      setError("");
      setSuccess("");
      const reader = await createBarcodeReader();
      const result = await reader.decodeFromImageUrl(imageUrl);
      returnBarcode(result.getText());
    } catch {
      setError(
        "No readable barcode was found in the photo. Keep the full barcode sharp and well lit, then try again.",
      );
    } finally {
      URL.revokeObjectURL(imageUrl);
      setIsPhotoScanning(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  function retryCamera() {
    controlsRef.current?.stop();
    controlsRef.current = undefined;
    stopVideoTracks(videoRef.current);
    setActiveDeviceId("");
    setError("");
    setSuccess("");
    setStatus("requesting");
    setCameraAttempt((attempt) => attempt + 1);
  }

  function switchCamera() {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(
      (device) => device.deviceId === currentDeviceIdRef.current,
    );
    const nextDevice = devices[(currentIndex + 1) % devices.length];
    setActiveDeviceId(nextDevice.deviceId);
  }

  async function toggleTorch() {
    if (!controlsRef.current?.switchTorch) return;

    try {
      const nextTorchState = !torchEnabled;
      await controlsRef.current.switchTorch(nextTorchState);
      setTorchEnabled(nextTorchState);
    } catch {
      setError("Flashlight control is not available for this camera.");
      setTorchSupported(false);
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-pine/70 p-3 backdrop-blur-sm sm:px-4 sm:py-5">
      <section
        aria-modal="true"
        className="scrollbar-hidden max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-line bg-white shadow-[0_28px_80px_rgba(7,54,42,0.35)] sm:max-h-[94vh]"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-line p-4 sm:px-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-leaf-dark">
              Camera scanner
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-pine sm:text-2xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-line text-ink-soft transition hover:border-leaf/40 hover:text-pine"
            aria-label="Close barcode scanner"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-4 sm:p-5">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-pine sm:aspect-video">
            <video
              ref={videoRef}
              autoPlay
              className="h-full w-full object-cover"
              disablePictureInPicture
              muted
              playsInline
            />
            <div className="pointer-events-none absolute inset-0 bg-pine/10" />
            <div className="barcode-scanner-frame pointer-events-none absolute bottom-[25%] left-[7%] right-[7%] top-[25%] overflow-hidden rounded-2xl border-leaf">
              {status === "scanning" && <span className="barcode-scan-line" />}
              <span className="barcode-corner barcode-corner-tl" />
              <span className="barcode-corner barcode-corner-tr" />
              <span className="barcode-corner barcode-corner-bl" />
              <span className="barcode-corner barcode-corner-br" />
            </div>

            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-pine/75 px-3 py-2 text-xs font-black text-white backdrop-blur-md">
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "success"
                    ? "bg-mint"
                    : status === "scanning"
                      ? "bg-green-400"
                      : "bg-amber-300"
                }`}
              />
              {status === "requesting"
                ? "Opening camera"
                : status === "success"
                  ? "Barcode detected"
                  : status === "scanning"
                    ? "Camera active"
                    : "Camera unavailable"}
            </div>

            <div className="absolute right-3 top-3 flex gap-2">
              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-pine shadow-md transition hover:bg-white"
                  aria-label="Switch camera"
                >
                  <SwitchCamera size={19} />
                </button>
              )}
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-md transition ${
                    torchEnabled
                      ? "bg-leaf text-white"
                      : "bg-white/90 text-pine hover:bg-white"
                  }`}
                  aria-label="Toggle flashlight"
                >
                  <Flashlight size={19} />
                </button>
              )}
            </div>

            {status === "requesting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-pine/70 text-white">
                <div className="text-center">
                  <LoaderCircle className="mx-auto animate-spin" size={26} />
                  <p className="mt-3 text-sm font-black">Opening camera...</p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="barcode-result-pop absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-leaf px-4 py-2 text-xs font-black text-white shadow-lg">
                <CheckCircle2 size={17} /> Barcode captured
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-sm font-bold text-ink-soft">
            Place the barcode inside the frame.
          </p>

          <input
            ref={photoInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) =>
              void scanBarcodePhoto(event.target.files?.[0])
            }
            type="file"
          />
          <button
            type="button"
            disabled={isPhotoScanning || status === "success"}
            onClick={() => photoInputRef.current?.click()}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-leaf/35 bg-leaf/5 px-4 text-sm font-black text-leaf-dark transition hover:bg-leaf/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPhotoScanning ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Camera size={17} />
            )}
            {isPhotoScanning ? "Reading barcode..." : "Take barcode photo"}
          </button>

          {error && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <span>{error}</span>
              </span>
              <button
                type="button"
                onClick={retryCamera}
                className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-black text-red-600 transition hover:border-red-300"
              >
                <RefreshCw size={14} /> Retry Camera
              </button>
            </div>
          )}

          {success && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-leaf/25 bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf-dark">
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <span>{success}</span>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-ink-line bg-paper p-4">
            <label className="text-xs font-black uppercase tracking-wide text-ink-soft">
              Manual barcode fallback
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-ink-line bg-white px-3 focus-within:border-leaf/50">
                <Keyboard size={17} className="shrink-0 text-leaf-dark" />
                <input
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  onChange={(event) => setManualBarcode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      returnBarcode(manualBarcode);
                    }
                  }}
                  placeholder="Enter or use a USB scanner"
                  type="text"
                  value={manualBarcode}
                />
              </div>
              <button
                type="button"
                onClick={() => returnBarcode(manualBarcode)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-leaf px-4 text-sm font-black text-white transition hover:bg-leaf-dark"
              >
                <Barcode size={17} /> Use Barcode
              </button>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-xl border border-ink-line px-5 text-sm font-black text-ink transition hover:border-leaf/40 hover:text-pine sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default BarcodeScannerModal;
