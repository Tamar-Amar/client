import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab, TextField, Box, Typography, List, ListItemText, CircularProgress, ListItemButton } from '@mui/material';
import { useFetchAllUsers } from '../../queries/useUsers';
import { useFetchAllWorkersAfterNoon } from '../../queries/workerAfterNoonQueries';
import { User, WorkerAfterNoon } from '../../types';

interface ImpersonateDialogProps {
  open: boolean;
  onClose: () => void;
  onImpersonate: (user: any, type: any) => void;
}

const ImpersonateDialog: React.FC<ImpersonateDialogProps> = ({ open, onClose, onImpersonate }) => {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading: usersLoading } = useFetchAllUsers();
  const { data: workers = [], isLoading: workersLoading } = useFetchAllWorkersAfterNoon();

  const loading = usersLoading || workersLoading;

  const filteredUsers = Array.isArray(users) && users.length > 0
    ? users
        .filter((u: User) =>
          ['coordinator', 'accountant',  'manager_project'].includes(u.role)
        )
        .filter((u: User) =>
          (u.lastName + ' ' + u.firstName + ' ' + u.role)
            .toLowerCase().includes(search.toLowerCase())
        )
    : [];

  const filteredWorkers = Array.isArray(workers) && workers.length > 0
    ? workers.filter((w: WorkerAfterNoon) =>
        (w.lastName + ' ' + w.firstName + ' ' + w.id)
          .toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const roleLabels: Record<string, string> = {
    admin: 'מנהל מערכת',
    manager_project: 'מנהל פרויקט',
    accountant: 'חשב שכר',
    coordinator: 'רכז',
    worker: 'עובד צהרון',
    operator: 'מפעיל',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>התחברות כמשתמש אחר</DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'background.paper', pb: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
            <Tab label="משתמשים" />
            <Tab label="עובדי צהרון" />
          </Tabs>
          <TextField
            label={'חיפוש לפי שם / ת"ז / שם משתמש'}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            fullWidth
            sx={{ my: 2 }}
          />
        </Box>
        <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {(tab === 0 ? filteredUsers : filteredWorkers).map((user: any) => (
                <ListItemButton key={user._id} onClick={() => onImpersonate(user, tab === 0 ? 'user' : 'worker')}>
                    <ListItemText
                    primary={
                        <>
                        <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                            {user.lastName + ' ' + user.firstName}
                        </span>
                        {user.role ? ` | ${roleLabels[user.role] || user.role}` : ''}
                        </>
                    }
                    secondary={
                        (user.id && `ת\"ז: ${user.id}`)
                    }
                    />
                </ListItemButton>
              ))}
              {(tab === 0 ? filteredUsers : filteredWorkers).length === 0 && !loading && (
                <Typography align="center" color="text.secondary" sx={{ mt: 2 }}>
                  לא נמצאו משתמשים
                </Typography>
              )}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>סגור</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImpersonateDialog; 