import { InboxIcon } from './ui/icons';

// Shown in place of Studio when the sandbox account has nothing to report on.
export function EmptyData() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-pp-highlight text-pp-blue">
        <InboxIcon className="size-7" />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-pp-navy">No account data yet</h2>
      <p className="mt-2 max-w-md text-[15px] text-pp-muted">
        This sandbox account has no invoices, products, plans or transactions. Add some in the sandbox, then
        refresh to build reports from them.
      </p>
    </div>
  );
}
