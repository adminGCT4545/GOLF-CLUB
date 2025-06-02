import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Cancel as CancelIcon,
  Group as GroupIcon
} from '@mui/icons-material';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  member_number: string;
}

interface MassMessageDialogProps {
  open: boolean;
  onClose: () => void;
  selectedMembers: Member[];
  onSuccess?: () => void;
}

const MassMessageDialog: React.FC<MassMessageDialogProps> = ({
  open,
  onClose,
  selectedMembers,
  onSuccess
}) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!sending) {
      setSubject('');
      setContent('');
      setError(null);
      onClose();
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      setError('Subject and message content are required');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('No recipients selected');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/messages/mass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientIds: selectedMembers.map(member => member.id),
          subject: subject.trim(),
          content: content.trim(),
          messageType: 'announcement'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send mass message');
      }
    } catch (error) {
      console.error('Error sending mass message:', error);
      setError('Network error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <GroupIcon color="primary" />
          <Typography variant="h5" component="div">
            Send Mass Message
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Recipients Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recipients ({selectedMembers.length})
          </Typography>
          <Box
            sx={{
              maxHeight: 120,
              overflowY: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              bgcolor: 'background.paper'
            }}
          >
            {selectedMembers.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No members selected
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedMembers.map((member) => (
                  <Chip
                    key={member.id}
                    label={`${member.first_name} ${member.last_name} (${member.member_number})`}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Message Form */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (error) setError(null);
            }}
            disabled={sending}
            required
            inputProps={{ maxLength: 200 }}
            helperText={`${subject.length}/200 characters`}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Message Content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            disabled={sending}
            required
            multiline
            rows={6}
            inputProps={{ maxLength: 2000 }}
            helperText={`${content.length}/2000 characters`}
            placeholder="Type your message here..."
          />
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          This message will be sent to {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} as an announcement.
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={sending}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={sending || selectedMembers.length === 0 || !subject.trim() || !content.trim()}
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
        >
          {sending ? 'Sending...' : `Send to ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MassMessageDialog;
