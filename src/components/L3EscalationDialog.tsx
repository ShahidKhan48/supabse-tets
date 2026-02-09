import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface L3EscalationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  isCurrentlyL3: boolean;
  loading?: boolean;
}

export function L3EscalationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isCurrentlyL3,
  loading = false
}: L3EscalationDialogProps) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    onConfirm(comment.trim());
    setComment('');
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };

  const isValid = comment.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="mobile-dialog mobile-safe-area">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCurrentlyL3 ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Remove L3 Escalation
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Mark as L3 Escalation
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <p className="text-sm sm:text-base text-muted-foreground">
              {isCurrentlyL3 
                ? 'Are you sure you want to remove the L3 escalation from this ticket?'
                : 'This will escalate the ticket to L3 support level.'
              }
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isCurrentlyL3 
                ? "Please explain why this ticket no longer needs L3 escalation..."
                : "Please explain why this ticket needs L3 escalation..."
              }
              className="mobile-textarea mobile-text resize-none"
              required
            />
            <p className="text-xs sm:text-sm text-muted-foreground">
              A detailed explanation is required for L3 escalation changes.
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
              variant={isCurrentlyL3 ? "default" : "destructive"}
              className="mobile-button"
            >
              {loading 
                ? 'Processing...' 
                : isCurrentlyL3 
                  ? 'Remove L3 Escalation'
                  : 'Escalate to L3'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}