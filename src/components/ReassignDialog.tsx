import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name: string;
  role_name: string;
}

interface ReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReassign: (userId: string | null, comment: string) => Promise<void>;
  users: User[];
  currentAssignee: string | null;
  loading?: boolean;
}

export const ReassignDialog = ({
  open,
  onOpenChange,
  onReassign,
  users,
  currentAssignee,
  loading = false
}: ReassignDialogProps) => {
  const [selectedUser, setSelectedUser] = useState<string>(currentAssignee || "unassigned");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onReassign(
        selectedUser === "unassigned" ? null : selectedUser,
        comment.trim()
      );
      setComment("");
      setSelectedUser(currentAssignee || "unassigned");
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mobile-dialog mobile-safe-area">
        <DialogHeader>
          <DialogTitle>Reassign Ticket</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          <div>
            <Label htmlFor="assignee" className="text-sm font-medium">Assign to</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="mobile-input mt-2">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comment" className="text-sm font-medium">Comment *</Label>
            <Textarea
              id="comment"
              placeholder="Please provide a reason for reassignment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-2 mobile-textarea mobile-text resize-none"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              A comment is required when reassigning tickets.
            </p>
          </div>
        </div>

        <DialogFooter className="mobile-footer">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="mobile-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!comment.trim() || submitting || loading}
            className="mobile-button"
          >
            {submitting ? "Reassigning..." : "Reassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};