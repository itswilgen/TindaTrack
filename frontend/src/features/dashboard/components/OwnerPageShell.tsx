import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../../../constants/storage";
import { readJson } from "../../../utils/storage";
import OwnerSidebar from "./OwnerSidebar";

type OwnerPageShellProps = {
  badge: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
  topLabel: string;
};

function OwnerPageShell({
  badge,
  children,
  description,
  title,
  topLabel,
}: OwnerPageShellProps) {
  const user = readJson<{ name?: string }>(STORAGE_KEYS.user);
  const ownerName = user?.name || "Owner";
  const initial = ownerName.charAt(0).toUpperCase();

  return (
    <main className="h-dvh overflow-hidden bg-paper-dim font-sans text-ink">
      <OwnerSidebar />

      <section className="h-dvh min-w-0 overflow-x-hidden overflow-y-auto lg:ml-72">
        <header className="dashboard-enter sticky top-0 z-30 border-b border-ink-line bg-paper-dim/95 py-3 pl-20 pr-4 shadow-md shadow-pine/10 backdrop-blur-xl sm:pr-6 lg:px-7 lg:py-5">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink-soft sm:text-sm">{topLabel}</p>
              <h1 className="truncate font-display text-xl font-bold text-pine sm:text-2xl lg:text-3xl">
                {title}
              </h1>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-sm font-bold text-white sm:h-12 sm:w-12">
              {initial}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-5 lg:p-7">
          <section className="dashboard-enter rounded-xl bg-white p-4 shadow-[0_18px_45px_rgba(15,111,87,0.07)] sm:rounded-2xl sm:p-5">
            <div className="flex flex-col gap-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-leaf/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-leaf-dark">
                {badge}
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-pine sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-ink-soft">
                  {description}
                </p>
              </div>
            </div>

            {children}
          </section>
        </div>
      </section>
    </main>
  );
}

export default OwnerPageShell;
