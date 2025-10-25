import EntryCardRedesigned from './EntryCardRedesigned';

export default function DocumentGridRedesigned({
  entries,
  onExpand,
  searchTerm,
  selectedDocuments = new Set(),
  onSelectDocument,
  selectionMode = false,
  onContextMenu
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6
                    gap-3 items-start auto-rows-max">
      {entries.map((entry) => (
        <EntryCardRedesigned
          key={entry.id}
          entry={entry}
          onExpand={onExpand}
          isSelected={selectedDocuments.has(entry.id)}
          onSelect={onSelectDocument}
          selectionMode={selectionMode}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}
