import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  EmojiEvents,
  PersonAdd,
  CalendarToday,
  LocationOn,
  AttachMoney,
  People,
  Search,
  Filter,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface Tournament {
  id: string;
  name: string;
  date: string;
  endDate: string;
  location: string;
  format: string;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'registration_open';
  description: string;
  prize: string;
  handicapRequirement?: string;
  image?: string;
}

interface Registration {
  id: string;
  tournamentId: string;
  memberName: string;
  handicap: number;
  registrationDate: string;
  status: 'confirmed' | 'waitlist' | 'cancelled';
}

interface LeaderboardEntry {
  position: number;
  memberName: string;
  score: string;
  rounds: number[];
  total: number;
  handicap: number;
}

const TournamentsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registrationDialog, setRegistrationDialog] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [tournaments] = useState<Tournament[]>([
    {
      id: '1',
      name: 'Spring Championship',
      date: '2024-03-15',
      endDate: '2024-03-17',
      location: 'Championship Course',
      format: 'Stroke Play - 3 Rounds',
      entryFee: 150,
      maxParticipants: 64,
      currentParticipants: 42,
      status: 'registration_open',
      description: 'Annual spring championship tournament featuring 54 holes of stroke play competition.',
      prize: '$5,000 Total Prize Pool',
      handicapRequirement: 'Maximum 18',
    },
    {
      id: '2',
      name: 'Member-Guest Tournament',
      date: '2024-04-20',
      endDate: '2024-04-21',
      location: 'Executive Course',
      format: 'Best Ball - 2 Rounds',
      entryFee: 200,
      maxParticipants: 48,
      currentParticipants: 36,
      status: 'upcoming',
      description: 'Invite your favorite golf partner for this exciting member-guest competition.',
      prize: 'Trophies & Prizes',
    },
    {
      id: '3',
      name: 'Club Championship',
      date: '2024-02-10',
      endDate: '2024-02-11',
      location: 'Championship Course',
      format: 'Match Play',
      entryFee: 100,
      maxParticipants: 32,
      currentParticipants: 32,
      status: 'completed',
      description: 'Head-to-head match play to determine the club champion.',
      prize: 'Championship Trophy',
    },
  ]);

  const [myRegistrations] = useState<Registration[]>([
    {
      id: '1',
      tournamentId: '1',
      memberName: `${user?.firstName} ${user?.lastName}`,
      handicap: 12,
      registrationDate: '2024-01-15',
      status: 'confirmed',
    },
  ]);

  const [leaderboard] = useState<LeaderboardEntry[]>([
    { position: 1, memberName: 'John Smith', score: '-6', rounds: [68, 70, 66], total: 204, handicap: 8 },
    { position: 2, memberName: 'Mike Johnson', score: '-4', rounds: [69, 69, 68], total: 206, handicap: 12 },
    { position: 3, memberName: 'Sarah Wilson', score: '-2', rounds: [70, 68, 70], total: 208, handicap: 6 },
    { position: 4, memberName: 'Tom Brown', score: 'E', rounds: [71, 70, 71], total: 212, handicap: 15 },
    { position: 5, memberName: 'Lisa Davis', score: '+2', rounds: [72, 71, 71], total: 214, handicap: 18 },
  ]);

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open': return 'success';
      case 'upcoming': return 'info';
      case 'ongoing': return 'warning';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'registration_open': return 'Registration Open';
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const handleRegister = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setRegistrationDialog(true);
  };

  const confirmRegistration = () => {
    setAlert({ 
      type: 'success', 
      message: `Successfully registered for ${selectedTournament?.name}!` 
    });
    setRegistrationDialog(false);
    setSelectedTournament(null);
  };

  const isRegistered = (tournamentId: string) => {
    return myRegistrations.some(reg => reg.tournamentId === tournamentId && reg.status === 'confirmed');
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming' || t.status === 'registration_open');
  const myTournaments = tournaments.filter(t => isRegistered(t.id));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Tournaments
        </Typography>
        <Button
          variant="contained"
          startIcon={<EmojiEvents />}
          sx={{ borderRadius: 2 }}
        >
          Tournament History
        </Button>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">Total Tournaments</Typography>
                  <Typography variant="h4">{tournaments.length}</Typography>
                </Box>
                <EmojiEvents sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">My Registrations</Typography>
                  <Typography variant="h4">{myRegistrations.length}</Typography>
                </Box>
                <PersonAdd sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">Upcoming</Typography>
                  <Typography variant="h4">{upcomingTournaments.length}</Typography>
                </Box>
                <CalendarToday sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">This Month</Typography>
                  <Typography variant="h4">3</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="All Tournaments" />
          <Tab label={<Badge badgeContent={myTournaments.length} color="primary">My Tournaments</Badge>} />
          <Tab label="Leaderboards" />
        </Tabs>
      </Card>

      {/* Search and Filter */}
      {activeTab === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search tournaments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                    startAdornment={<Filter sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="registration_open">Registration Open</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="ongoing">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Content based on active tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {filteredTournaments.map((tournament) => (
            <Grid item xs={12} md={6} lg={4} key={tournament.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      {tournament.name}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(tournament.status)} 
                      color={getStatusColor(tournament.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(tournament.date).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {tournament.location}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Entry Fee: ${tournament.entryFee}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <People sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {tournament.currentParticipants} / {tournament.maxParticipants} participants
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={(tournament.currentParticipants / tournament.maxParticipants) * 100}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {tournament.description}
                  </Typography>
                  
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                    Prize: {tournament.prize}
                  </Typography>
                </CardContent>
                
                <Box sx={{ p: 2, pt: 0 }}>
                  {isRegistered(tournament.id) ? (
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      disabled
                      sx={{ borderRadius: 2 }}
                    >
                      Registered
                    </Button>
                  ) : tournament.status === 'registration_open' ? (
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => handleRegister(tournament)}
                      sx={{ borderRadius: 2 }}
                    >
                      Register Now
                    </Button>
                  ) : (
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      disabled
                      sx={{ borderRadius: 2 }}
                    >
                      {getStatusLabel(tournament.status)}
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              My Tournament Registrations
            </Typography>
            {myTournaments.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                You haven't registered for any tournaments yet.
              </Typography>
            ) : (
              <List>
                {myTournaments.map((tournament, index) => (
                  <React.Fragment key={tournament.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <EmojiEvents />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={tournament.name}
                        secondary={`${new Date(tournament.date).toLocaleDateString()} - ${tournament.location}`}
                      />
                      <Chip 
                        label={getStatusLabel(tournament.status)} 
                        color={getStatusColor(tournament.status) as any}
                        size="small"
                      />
                    </ListItem>
                    {index < myTournaments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Club Championship Leaderboard
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Position</strong></TableCell>
                    <TableCell><strong>Player</strong></TableCell>
                    <TableCell><strong>Score</strong></TableCell>
                    <TableCell><strong>R1</strong></TableCell>
                    <TableCell><strong>R2</strong></TableCell>
                    <TableCell><strong>R3</strong></TableCell>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell><strong>HCP</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry) => (
                    <TableRow key={entry.position} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {entry.position <= 3 && (
                            <Star sx={{ 
                              fontSize: 20, 
                              mr: 1, 
                              color: entry.position === 1 ? 'gold' : entry.position === 2 ? 'silver' : '#CD7F32'
                            }} />
                          )}
                          {entry.position}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: entry.position <= 3 ? 'bold' : 'normal' }}>
                        {entry.memberName}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 'bold',
                        color: entry.total < 212 ? 'success.main' : entry.total > 216 ? 'error.main' : 'text.primary'
                      }}>
                        {entry.score}
                      </TableCell>
                      <TableCell>{entry.rounds[0]}</TableCell>
                      <TableCell>{entry.rounds[1]}</TableCell>
                      <TableCell>{entry.rounds[2]}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{entry.total}</TableCell>
                      <TableCell>{entry.handicap}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Registration Dialog */}
      <Dialog open={registrationDialog} onClose={() => setRegistrationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Register for {selectedTournament?.name}
        </DialogTitle>
        <DialogContent>
          {selectedTournament && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Confirm your registration for this tournament:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Tournament" secondary={selectedTournament.name} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Date" secondary={`${new Date(selectedTournament.date).toLocaleDateString()} - ${new Date(selectedTournament.endDate).toLocaleDateString()}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Entry Fee" secondary={`$${selectedTournament.entryFee}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Format" secondary={selectedTournament.format} />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrationDialog(false)}>Cancel</Button>
          <Button onClick={confirmRegistration} variant="contained">
            Confirm Registration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentsPage;
