import logo from "../assets/images/TindaLogo.png";

type BrandLogoProps = {
  className?: string;
};

function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <img
      src={logo}
      alt="TindaTrack logo"
      className={`object-contain ${className}`}
    />
  );
}

export default BrandLogo;
