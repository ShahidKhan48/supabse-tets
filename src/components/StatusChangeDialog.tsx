import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: string, comment: string) => void;
  currentStatus: string;
  loading?: boolean;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export function StatusChangeDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentStatus,
  loading = false
}: StatusChangeDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    onConfirm(selectedStatus, comment.trim());
    setComment('');
    setSelectedStatus(currentStatus);
  };

  const handleClose = () => {
    setComment('');
    setSelectedStatus(currentStatus);
    onClose();
  };

  const isValid = comment.trim().length > 0 && selectedStatus !== currentStatus;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="mobile-dialog mobile-safe-area">
        <DialogHeader>
          <DialogTitle>Update Ticket Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="mobile-input">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.value === currentStatus}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Comment <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Please provide a reason for this status change..."
              className="mobile-textarea mobile-text resize-none"
              required
            />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Comments are mandatory when changing ticket status.
            </p>
          </div>
          
          <DialogFooter className="mobile-footer">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="mobile-button"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || loading}
              className="mobile-button"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}