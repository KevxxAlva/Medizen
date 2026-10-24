import { Pencil, Trash2 } from "lucide-react";

export interface TableRowActionsProps {
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function TableRowActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  className = "p-4",
}: TableRowActionsProps) {
  return (
    <td className={className}>
      <div className="flex items-center gap-3 text-muted-foreground">
        <button
          type="button"
          aria-label={editLabel}
          onClick={onEdit}
          className="hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={deleteLabel}
          onClick={onDelete}
          className="hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </td>
  );
}
