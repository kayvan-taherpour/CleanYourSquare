import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
} from '@mui/icons-material';
import { transactionsAPI } from '../../services/api';

interface Transaction {
  _id: string;
  client: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  booking?: {
    _id: string;
    serviceType: string;
    scheduledDate: string;
    address: string;
    employees?: Array<{ firstName: string; lastName: string }>;
  };
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'payment' | 'refund' | 'expense';
  transactionId: string;
}

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await transactionsAPI.getAll(params);
      setTransactions(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditForm({
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      type: transaction.type,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTransaction) return;
    
    try {
      await transactionsAPI.update(selectedTransaction._id, editForm);
      setEditDialogOpen(false);
      loadTransactions();
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Transactions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Service Address</TableCell>
              <TableCell>Employee/Contractor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>{transaction.transactionId}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{transaction.client.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {transaction.client.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                <TableCell>{transaction.paymentMethod}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{formatDate(transaction.paymentDate)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(transaction.paymentDate)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {transaction.booking?.address || 'N/A'}
                </TableCell>
                <TableCell>
                  {transaction.booking?.employees?.map(e => `${e.firstName} ${e.lastName}`).join(', ') || 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip label={transaction.status} color={getStatusColor(transaction.status) as any} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(transaction)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Amount"
              fullWidth
              type="number"
              value={editForm.amount || ''}
              onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={editForm.paymentMethod || ''}
                label="Payment Method"
                onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="debit_card">Debit Card</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status || ''}
                label="Status"
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionsPage;

