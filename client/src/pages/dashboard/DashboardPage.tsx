import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { clientsAPI, bookingsAPI, transactionsAPI } from '../../services/api';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    upcomingBookings: 0,
    monthlyRevenue: 0,
    completedJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const [clientsRes, bookingsRes, transactionsRes] = await Promise.all([
        clientsAPI.getAll({ limit: 1 }),
        bookingsAPI.getAll({ status: 'confirmed', limit: 1 }),
        transactionsAPI.getStatistics(),
      ]);

      // Get total counts
      const totalClients = clientsRes.total || 0;
      const upcomingBookings = bookingsRes.total || 0;
      
      // Calculate monthly revenue (last 30 days)
      const now = new Date();
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyTransactions = await transactionsAPI.getAll({
        status: 'completed',
        startDate: lastMonth.toISOString(),
        limit: 1000,
      });
      
      const monthlyRevenue = monthlyTransactions.data.reduce(
        (sum: number, t: any) => sum + (t.amount || 0),
        0
      );

      // Get completed bookings
      const completedBookings = await bookingsAPI.getAll({
        status: 'completed',
        limit: 1,
      });
      const completedJobs = completedBookings.total || 0;

      setStats({
        totalClients,
        upcomingBookings,
        monthlyRevenue,
        completedJobs,
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients.toLocaleString(),
      icon: <PeopleIcon fontSize="large" />,
      color: 'primary.main',
    },
    {
      title: 'Upcoming Bookings',
      value: stats.upcomingBookings.toString(),
      icon: <CalendarIcon fontSize="large" />,
      color: 'secondary.main',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <MoneyIcon fontSize="large" />,
      color: 'success.main',
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs.toString(),
      icon: <CheckCircleIcon fontSize="large" />,
      color: 'info.main',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                height: '100%',
                borderLeft: `4px solid ${stat.color}`,
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  color: 'white',
                  bgcolor: stat.color,
                }}
              >
                {stat.icon}
              </Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Bookings
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Recent bookings will appear here
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Quick actions will appear here
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
