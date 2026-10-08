/**
 * Responsive data table wrapper (mobile: horizontal scroll).
 *
 *   <Table headers={["Rider", "Vehicle", "Actions"]}>
 *     <tr><td>…</td></tr>
 *   </Table>
 */
export default function Table({ headers = [], children, caption }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="border-b border-border bg-background">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}