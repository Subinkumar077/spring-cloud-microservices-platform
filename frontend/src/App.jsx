import { useCallback, useEffect, useMemo, useState } from 'react';

const navigation = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'hotels', label: 'Hotels', icon: 'building' },
  { id: 'users', label: 'Guests', icon: 'users' },
  { id: 'ratings', label: 'Ratings', icon: 'star' },
];

const resources = [
  { key: 'users', label: 'Guests', path: '/api/users/getalluser' },
  { key: 'hotels', label: 'Hotels', path: '/api/hotels' },
  { key: 'ratings', label: 'Ratings', path: '/api/ratings/getallratings' },
];

const emptyData = { users: [], hotels: [], ratings: [] };

async function request(path, options) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.json();
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    building: <><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01M15 12v.01M15 15v.01M15 18v.01" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    star: <><path d="m12 3 2.8 5.67 6.26.91-4.53 4.42 1.07 6.24L12 17.3l-5.6 2.94 1.07-6.24L2.94 9.58l6.26-.91L12 3Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.55-2.6L20 12M4 12l2.85 5.6A7 7 0 0 0 18.4 15" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function getName(user) {
  return user?.name?.trim() || 'Unnamed guest';
}

function getHotelRaterCount(ratings, hotelId) {
  return new Set(
    ratings
      .filter((rating) => rating.hotelId === hotelId && rating.userId)
      .map((rating) => rating.userId),
  ).size;
}

function getHotelRaterSummary(ratings, hotelId) {
  const count = getHotelRaterCount(ratings, hotelId);
  if (count === 0) return 'No guest ratings yet';
  return `${count} ${count === 1 ? 'guest' : 'guests'} rated`;
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';
}

function formatDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Recently'
    : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function App() {
  const [activePage, setActivePage] = useState('overview');
  const [data, setData] = useState(emptyData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled(
      resources.map(async ({ key, path }) => [key, await request(path)]),
    );
    const nextErrors = {};
    setData((current) => {
      const next = { ...current };
      results.forEach((result, index) => {
        const resource = resources[index];
        if (result.status === 'fulfilled') {
          const [key, value] = result.value;
          next[key] = Array.isArray(value) ? value : [];
        } else {
          nextErrors[resource.key] = result.reason?.message || 'Could not load data';
        }
      });
      return next;
    });
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const averageRating = useMemo(() => {
    if (!data.ratings.length) return '—';
    const total = data.ratings.reduce((sum, item) => sum + (Number(item.rating) || 0), 0);
    return (total / data.ratings.length).toFixed(1);
  }, [data.ratings]);

  const filteredHotels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data.hotels;
    return data.hotels.filter((hotel) =>
      [hotel.name, hotel.location, hotel.about].some((value) =>
        value?.toLowerCase().includes(query),
      ),
    );
  }, [data.hotels, search]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data.users;
    return data.users.filter((user) =>
      [user.name, user.email, user.about].some((value) =>
        value?.toLowerCase().includes(query),
      ),
    );
  }, [data.users, search]);

  const openDialog = (type) => {
    setFormError('');
    setDialog(type);
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    if (dialog === 'rating') payload.rating = Number(payload.rating);
    setSaving(true);
    setFormError('');

    try {
      const endpoint = { user: '/api/users', hotel: '/api/hotels', rating: '/api/ratings' }[dialog];
      await request(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      setDialog(null);
      await loadData();
    } catch (error) {
      setFormError(error.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = navigation.find((item) => item.id === activePage)?.label;
  const actionType = {
    hotels: 'hotel',
    users: 'user',
    ratings: 'rating',
  }[activePage] || 'hotel';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setActivePage('overview'); }}>
          <span className="brand-mark"><Icon name="building" size={20} /></span>
          <span>staywell<span className="brand-dot">.</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              className={`nav-link ${activePage === item.id ? 'active' : ''}`}
              key={item.id}
              onClick={() => { setActivePage(item.id); setSearch(''); }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === 'hotels' && <span className="nav-count">{data.hotels.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Icon name="building" size={17} /></div>
            <p>Your hospitality<br />platform, in one place.</p>
            <span>Simple tools for a better stay.</span>
          </div>
          <div className="profile">
            <div className="profile-avatar">S</div>
            <div className="profile-copy"><strong>Workspace</strong><span>Administrator</span></div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{pageTitle}</strong></div>
          <div className="topbar-right">
            <span className={`connection ${Object.keys(errors).length ? 'offline' : ''}`}>
              <span className="connection-dot" />
              {Object.keys(errors).length ? 'Needs attention' : 'Services connected'}
            </span>
            <button className="avatar-button" aria-label="Workspace profile">S</button>
          </div>
        </header>

        <div className="page-wrap">
          <section className="page-heading">
            <div>
              <p className="eyebrow">{activePage === 'overview' ? 'YOUR BUSINESS AT A GLANCE' : 'WORKSPACE DIRECTORY'}</p>
              <h1>{activePage === 'overview' ? 'Good morning' : pageTitle}<span className="heading-period">.</span></h1>
              <p className="page-subtitle">
                {activePage === 'overview'
                  ? 'Here’s what’s happening across your hotel platform.'
                  : `Manage your ${pageTitle.toLowerCase()} and keep everything in order.`}
              </p>
            </div>
            <div className="heading-actions">
              <button className="icon-button refresh-button" onClick={loadData} aria-label="Refresh data">
                <Icon name="refresh" size={17} />
              </button>
              <button className="button button-primary" onClick={() => openDialog(actionType)}>
                <Icon name="plus" size={17} />
                <span>{activePage === 'overview' ? 'Add new' : `Add ${actionType}`}</span>
              </button>
            </div>
          </section>

          {Object.keys(errors).length > 0 && (
            <div className="service-alert" role="status">
              <strong>Some services are unavailable.</strong>
              <span>
                {Object.keys(errors).map((key) => resources.find((resource) => resource.key === key)?.label).join(', ')} could not be loaded.
                {' '}Start the corresponding Spring service and refresh to try again.
              </span>
            </div>
          )}

          {activePage === 'overview' && (
            <Overview
              data={data}
              averageRating={averageRating}
              loading={loading}
              onNavigate={setActivePage}
              onAdd={openDialog}
            />
          )}
          {activePage === 'hotels' && (
            <HotelsPage hotels={filteredHotels} ratings={data.ratings} users={data.users} loading={loading} search={search} setSearch={setSearch} />
          )}
          {activePage === 'users' && (
            <UsersPage users={filteredUsers} loading={loading} search={search} setSearch={setSearch} />
          )}
          {activePage === 'ratings' && <RatingsPage data={data} loading={loading} />}
        </div>
      </main>

      {dialog && (
        <RecordDialog
          type={dialog}
          data={data}
          saving={saving}
          error={formError}
          onClose={() => setDialog(null)}
          onSubmit={saveRecord}
        />
      )}
    </div>
  );
}

function Overview({ data, averageRating, loading, onNavigate, onAdd }) {
  const recentRatings = [...data.ratings].slice(-4).reverse();
  const stats = [
    { label: 'Total hotels', value: data.hotels.length, note: 'In your directory', icon: 'building', tone: 'sage' },
    { label: 'Total guests', value: data.users.length, note: 'Registered guests', icon: 'users', tone: 'sand' },
    { label: 'Ratings received', value: data.ratings.length, note: 'Guest experiences', icon: 'star', tone: 'peach' },
    { label: 'Average rating', value: averageRating, note: 'Out of 10 points', icon: 'arrow', tone: 'blue' },
  ];

  return (
    <>
      <section className="stats-grid" aria-label="Platform statistics">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={18} /></div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-bottom"><strong>{loading ? <span className="skeleton skeleton-number" /> : stat.value}</strong><span>{stat.note}</span></div>
          </article>
        ))}
      </section>

      <div className="overview-grid">
        <section className="panel hotels-panel">
          <div className="panel-heading">
            <div><h2>Hotels</h2><p>Your places, all together.</p></div>
            <button className="text-link" onClick={() => onNavigate('hotels')}>View all <Icon name="arrow" size={15} /></button>
          </div>
          {data.hotels.length ? (
            <div className="hotel-list">
              {data.hotels.slice(0, 4).map((hotel, index) => (
                <div className="hotel-row" key={hotel.id || `${hotel.name}-${index}`}>
                  <div className={`hotel-thumb thumb-${index % 4}`}><Icon name="building" size={21} /></div>
                  <div className="hotel-info">
                    <strong>{hotel.name || 'Unnamed hotel'}</strong>
                    <span><Icon name="pin" size={13} />{hotel.location || 'Location not set'}</span>
                    <span className="hotel-rater-count"><Icon name="users" size={13} />{getHotelRaterSummary(data.ratings, hotel.id)}</span>
                  </div>
                  <span className="hotel-status"><span />Active</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState loading={loading} title="No hotels yet" message="Add your first hotel to get started." />
          )}
          <button className="add-hotel-row" onClick={() => onAdd('hotel')}><span><Icon name="plus" size={16} /></span> Add a hotel</button>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div><h2>Recent ratings</h2><p>What guests are saying.</p></div>
            <button className="text-link" onClick={() => onNavigate('ratings')}>See all <Icon name="arrow" size={15} /></button>
          </div>
          {recentRatings.length ? (
            <div className="activity-list">
              {recentRatings.map((rating, index) => {
                const user = data.users.find((item) => item.userId === rating.userId);
                const hotel = data.hotels.find((item) => item.id === rating.hotelId);
                const name = getName(user);
                return (
                  <div className="activity-row" key={rating.ratingId || `${rating.userId}-${index}`}>
                    <div className={`guest-avatar guest-${index % 4}`}>{initials(name)}</div>
                    <div className="activity-info"><strong>{name}</strong><span>for {hotel?.name || 'a hotel'}</span><p>{rating.feedback || 'Shared a rating.'}</p></div>
                    <span className="rating-pill"><Icon name="star" size={13} />{rating.rating ?? '—'}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState loading={loading} title="No ratings yet" message="Guest feedback will show up here." />
          )}
        </section>
      </div>

      <section className="quick-actions">
        <div><span className="eyebrow">GET STARTED</span><h2>Make your next move</h2></div>
        <button onClick={() => onAdd('hotel')}><span className="quick-icon"><Icon name="building" size={17} /></span><span><strong>Add a hotel</strong><small>Grow your directory</small></span><Icon name="arrow" size={15} /></button>
        <button onClick={() => onAdd('user')}><span className="quick-icon"><Icon name="users" size={17} /></span><span><strong>Add a guest</strong><small>Welcome someone new</small></span><Icon name="arrow" size={15} /></button>
        <button onClick={() => onAdd('rating')}><span className="quick-icon"><Icon name="star" size={17} /></span><span><strong>Add a rating</strong><small>Record an experience</small></span><Icon name="arrow" size={15} /></button>
      </section>
    </>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="search-box">
      <Icon name="search" size={17} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function HotelsPage({ hotels, ratings, users, loading, search, setSearch }) {
  const [expandedHotelId, setExpandedHotelId] = useState(null);

  return (
    <section className="panel directory-panel">
      <div className="directory-toolbar">
        <div><h2>All hotels <span className="result-count">{hotels.length}</span></h2><p>A complete list of your properties.</p></div>
        <SearchBox value={search} onChange={setSearch} placeholder="Search hotels..." />
      </div>
      {hotels.length ? (
        <div className="hotel-card-grid">
          {hotels.map((hotel, index) => {
            const hotelKey = hotel.id || `${hotel.name}-${index}`;
            const hotelReviews = ratings.filter((rating) => rating.hotelId === hotel.id && rating.userId);
            const guestCount = new Set(hotelReviews.map((rating) => rating.userId)).size;
            const isExpanded = expandedHotelId === hotelKey;
            const reviewsId = `hotel-reviews-${index}`;

            return (
              <article className="property-card" key={hotelKey}>
                <div className={`property-art property-art-${index % 4}`}>
                  <div className="art-sun" /><div className="art-building"><span /><span /><span /><span /><span /><span /></div>
                  <span className="property-id">{hotel.id ? `ID · ${hotel.id.slice(0, 8)}` : 'PROPERTY'}</span>
                </div>
                <div className="property-copy">
                  <div className="property-location"><Icon name="pin" size={14} />{hotel.location || 'Location not set'}</div>
                  <h3>{hotel.name || 'Unnamed hotel'}</h3>
                  <p>{hotel.about || 'A welcoming place for guests to stay.'}</p>
                  <div className="property-footer">
                    <span className="hotel-rater-count"><Icon name="users" size={13} />{getHotelRaterSummary(ratings, hotel.id)}</span>
                    <button
                      type="button"
                      className="review-toggle"
                      aria-expanded={isExpanded}
                      aria-controls={reviewsId}
                      disabled={guestCount === 0}
                      onClick={() => setExpandedHotelId(isExpanded ? null : hotelKey)}
                    >
                      {guestCount === 0 ? 'No reviews' : isExpanded ? 'Hide reviews' : 'View reviews'}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="hotel-reviews" id={reviewsId} aria-label={`Reviews for ${hotel.name || 'hotel'}`}>
                      {hotelReviews.map((rating, reviewIndex) => {
                        const guest = users.find((user) => user.userId === rating.userId);
                        const guestName = getName(guest);

                        return (
                          <div className="hotel-review" key={rating.ratingId || `${rating.userId}-${reviewIndex}`}>
                            <span className={`guest-avatar guest-${reviewIndex % 4}`}>{initials(guestName)}</span>
                            <div className="hotel-review-copy">
                              <strong>{guestName}</strong>
                              <p>{rating.feedback || 'No written review provided.'}</p>
                            </div>
                            <span className="rating-pill"><Icon name="star" size={13} />{rating.rating ?? '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState loading={loading} title={search ? 'No matching hotels' : 'No hotels yet'} message={search ? 'Try another search.' : 'Add your first property to see it here.'} />}
    </section>
  );
}

function UsersPage({ users, loading, search, setSearch }) {
  return (
    <section className="panel directory-panel">
      <div className="directory-toolbar">
        <div><h2>All guests <span className="result-count">{users.length}</span></h2><p>Your community of registered guests.</p></div>
        <SearchBox value={search} onChange={setSearch} placeholder="Search guests..." />
      </div>
      {users.length ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>GUEST</th><th>EMAIL ADDRESS</th><th>ABOUT</th><th>GUEST ID</th></tr></thead>
            <tbody>{users.map((user, index) => (
              <tr key={user.userId || `${user.email}-${index}`}>
                <td><div className="guest-cell"><span className={`guest-avatar guest-${index % 4}`}>{initials(getName(user))}</span><strong>{getName(user)}</strong></div></td>
                <td><span className="muted-cell"><Icon name="mail" size={14} />{user.email || '—'}</span></td>
                <td className="about-cell">{user.about || '—'}</td>
                <td><span className="id-cell">{user.userId || '—'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <EmptyState loading={loading} title={search ? 'No matching guests' : 'No guests yet'} message={search ? 'Try another search.' : 'Your registered guests will appear here.'} />}
    </section>
  );
}

function RatingsPage({ data, loading }) {
  return (
    <section className="panel directory-panel">
      <div className="directory-toolbar">
        <div><h2>Guest feedback <span className="result-count">{data.ratings.length}</span></h2><p>Every experience helps make a better stay.</p></div>
        <span className="rating-scale"><Icon name="star" size={15} /> Ratings out of 10</span>
      </div>
      {data.ratings.length ? (
        <div className="rating-list">
          {[...data.ratings].reverse().map((rating, index) => {
            const user = data.users.find((item) => item.userId === rating.userId);
            const hotel = data.hotels.find((item) => item.id === rating.hotelId);
            const name = getName(user);
            return (
              <article className="rating-card" key={rating.ratingId || `${rating.userId}-${index}`}>
                <div className={`guest-avatar guest-${index % 4}`}>{initials(name)}</div>
                <div className="rating-card-main">
                  <div className="rating-card-title"><strong>{name}</strong><span>rated</span><strong>{hotel?.name || 'Unknown hotel'}</strong></div>
                  <p>{rating.feedback || 'No written feedback provided.'}</p>
                  <span className="rating-date"><Icon name="clock" size={13} />{formatDate(rating.createdAt || rating.date)}</span>
                </div>
                <div className="rating-score"><Icon name="star" size={15} /><strong>{rating.rating ?? '—'}</strong><span>/ 10</span></div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState loading={loading} title="No feedback yet" message="Ratings from your guests will appear here." />}
    </section>
  );
}

function EmptyState({ loading, title, message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon name={loading ? 'refresh' : 'building'} size={20} /></span>
      <strong>{loading ? 'Loading your workspace' : title}</strong>
      <p>{loading ? 'Connecting to your services…' : message}</p>
    </div>
  );
}

function RecordDialog({ type, data, saving, error, onClose, onSubmit }) {
  const labels = { hotel: 'hotel', user: 'guest', rating: 'rating' };
  const title = { hotel: 'Add a hotel', user: 'Add a guest', rating: 'Add a rating' }[type];
  const singular = labels[type];

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div><span className="eyebrow">NEW RECORD</span><h2 id="modal-title">{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" size={18} /></button>
        </div>
        <p className="modal-intro">Add the details below to your platform.</p>
        <form onSubmit={onSubmit}>
          {type === 'hotel' && <>
            <FormField label="Hotel name" name="name" placeholder="e.g. The Grand House" required />
            <FormField label="Location" name="location" placeholder="City or neighborhood" required />
            <FormField label="About" name="about" placeholder="A short description of the property" multiline />
          </>}
          {type === 'user' && <>
            <FormField label="Guest name" name="name" placeholder="e.g. Jordan Lee" required />
            <FormField label="Email address" name="email" placeholder="jordan@example.com" type="email" required />
            <FormField label="About" name="about" placeholder="A little about this guest" multiline />
          </>}
          {type === 'rating' && <>
            <label className="form-field"><span>Guest</span><select name="userId" required defaultValue=""><option value="" disabled>Select a guest</option>{data.users.map((user) => <option key={user.userId} value={user.userId}>{getName(user)} · {user.email}</option>)}</select></label>
            <label className="form-field"><span>Hotel</span><select name="hotelId" required defaultValue=""><option value="" disabled>Select a hotel</option>{data.hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name} · {hotel.location}</option>)}</select></label>
            <FormField label="Rating (1–10)" name="rating" type="number" min="1" max="10" placeholder="8" required />
            <FormField label="Feedback" name="feedback" placeholder="Share a few words about the experience" multiline />
          </>}
          {type === 'rating' && (!data.users.length || !data.hotels.length) && (
            <p className="form-hint">Add at least one guest and one hotel before recording a rating.</p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving || (type === 'rating' && (!data.users.length || !data.hotels.length))}>
              {saving ? 'Saving…' : `Save ${singular}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormField({ label, name, placeholder, type = 'text', multiline = false, ...props }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {multiline
        ? <textarea name={name} placeholder={placeholder} rows="3" {...props} />
        : <input name={name} type={type} placeholder={placeholder} {...props} />}
    </label>
  );
}

export default App;
