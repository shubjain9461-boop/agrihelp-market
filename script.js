/* ═══════════════════════════════════════════════════════════════
       AGRIHELP — COMPLETE APPLICATION LOGIC
       
       Tech Architecture:
       - Canvas-based map (simulates Google Maps in standalone mode)
       - Haversine Formula for real distance calculation
       - JWT simulation (localStorage tokens)
       - Real-time simulation via setInterval
       - WebSocket-like notification system
    ═══════════════════════════════════════════════════════════════ */

    // ─── STATE ───────────────────────────────────────────────────
    const STATE = {
      connectionStatus: {},    // Tracks 'matched' or 'pending' connections
      role: 'farmer',          // 'farmer' | 'buyer'
      user: null,              // logged-in user object
      farmerLat: 18.5204,      // Default: Pune, Maharashtra
      farmerLng: 73.8567,
      buyers: [],              // all buyer posts
      filteredBuyers: [],      // after filter
      selectedBuyer: null,     // currently selected on map
      notifications: [],
      postedRequirements: [],  // buyer's own posts
      zoom: 1,
      panX: 0, panY: 0,
      chatOpen: false,
      notifOpen: false,
      buyerDashOpen: false,
      stats: { contacts: 0, distanceSaved: 0, rating: null },
      mapReady: false,
    };

    // ─── SEED BUYER DATA ──────────────────────────────────────────
    const SEED_BUYERS = [
      { id: 1, name: 'Suresh Wholesalers', emoji: 'SW', type: 'Wholesaler', product: 'Tomatoes', qty: 500, price: 2400, lat: 18.5500, lng: 73.8800, phone: '9876543210', deadline: '2026-04-15', rating: 4.5, reviews: 18, urgent: false, highValue: true },
      { id: 2, name: 'Pune Fresh Market', emoji: 'PM', type: 'Retailer', product: 'Onions', qty: 200, price: 1800, lat: 18.4900, lng: 73.8300, phone: '9823456789', deadline: '2026-04-10', rating: 3.8, reviews: 7, urgent: true, highValue: false },
      { id: 3, name: 'Raj Exports Pvt Ltd', emoji: 'RE', type: 'Exporter', product: 'Rice', qty: 1000, price: 3200, lat: 18.5700, lng: 73.9100, phone: '9812345678', deadline: '2026-04-20', rating: 4.2, reviews: 24, urgent: false, highValue: true },
      { id: 4, name: 'Hotel Grand Hyatt', emoji: 'HH', type: 'Restaurant', product: 'Potatoes', qty: 80, price: 1500, lat: 18.5100, lng: 73.8100, phone: '9898989898', deadline: '2026-04-08', rating: 4.8, reviews: 5, urgent: true, highValue: false },
      { id: 5, name: 'AgriProcess Industries', emoji: 'AI', type: 'Processor', product: 'Wheat', qty: 2000, price: 2800, lat: 18.6000, lng: 73.9300, phone: '9867123456', deadline: '2026-05-01', rating: 4.0, reviews: 31, urgent: false, highValue: true },
      { id: 6, name: 'City Supermart', emoji: 'CS', type: 'Retailer', product: 'Tomatoes', qty: 150, price: 2200, lat: 18.4800, lng: 73.8600, phone: '9845671234', deadline: '2026-04-12', rating: 3.5, reviews: 9, urgent: false, highValue: false },
      { id: 7, name: 'Mahadev Traders', emoji: 'MT', type: 'Wholesaler', product: 'Soybean', qty: 800, price: 4500, lat: 18.5300, lng: 73.7900, phone: '9876012345', deadline: '2026-04-25', rating: 4.6, reviews: 42, urgent: false, highValue: true },
      { id: 8, name: 'Spice Route Exports', emoji: 'SE', type: 'Exporter', product: 'Onions', qty: 600, price: 2100, lat: 18.5800, lng: 73.8400, phone: '9823001122', deadline: '2026-04-18', rating: 4.1, reviews: 15, urgent: true, highValue: false },
    ];

    // ─── HAVERSINE FORMULA ────────────────────────────────────────
    /**
     * Calculate distance between two GPS coordinates
     * using the Haversine formula
     * @returns distance in kilometers
     */
    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth radius in km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    function toRad(deg) { return deg * (Math.PI / 180); }

    // ─── AUTH LOGIC ───────────────────────────────────────────────
    let currentRole = 'farmer';
    let currentAuthTab = 'login';

    function setRole(role) {
      currentRole = role;
      document.querySelectorAll('.role-tab').forEach((t, i) =>
        t.classList.toggle('active', (role === 'farmer' && i === 0) || (role === 'buyer' && i === 1)));
      document.getElementById('role-label').textContent = role === 'farmer' ? 'Farmer' : 'Buyer';
    }

    function setAuthTab(tab) {
      currentAuthTab = tab;
      document.querySelectorAll('.auth-tab-btn').forEach((b, i) =>
        b.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'signup' && i === 1)));
      document.getElementById('panel-login').classList.toggle('active', tab === 'login');
      document.getElementById('panel-signup').classList.toggle('active', tab === 'signup');
    }

    function handleLogin() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-pass').value;

      if (!email || !pass) { showToast('⚠️ Please fill in all fields', 'error'); return; }

      // Frontend Email and Mobile validation
      if (!emailRegex.test(email) && !/^\d{10}$/.test(email)) {
        showToast('⚠️ Invalid email or mobile format', 'error'); return;
      }

      // Frontend Password length validation
      if (pass.length < 6) { showToast('⚠️ Password must be at least 6 characters', 'error'); return; }

      /*
        BACKEND VALIDATION SUGGESTION (Node.js/Express):
        app.post('/api/login', async (req, res) => {
          const { email, password } = req.body;
          if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/^\d{10}$/.test(email)) return res.status(400).json({ error: 'Invalid format' });
          if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
    
          const user = await db.users.findOne({ email });
          if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
             return res.status(401).json({ error: 'Invalid credentials' });
          }
          // Generate && return JWT token
        });
      */

      // Simulate JWT auth — in production, POST /api/auth/login
      const token = btoa(JSON.stringify({ email, role: currentRole, exp: Date.now() + 86400000 }));
      localStorage.setItem('agrihelp_token', token);

      const name = email.split('@')[0].replace(/\d/g, '').replace(/^./, c => c.toUpperCase()) || 'User';
      STATE.user = { name, email, role: currentRole };
      launchApp();
    }

    function handleSignup() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const name = document.getElementById('su-name').value.trim();
      const email = document.getElementById('su-email').value.trim();
      const mobile = document.getElementById('su-mobile').value.trim();
      const pass = document.getElementById('su-pass').value;

      if (!name || !email || !mobile || !pass) { showToast('⚠️ Please fill in all fields', 'error'); return; }

      // Frontend validations
      if (!emailRegex.test(email)) { showToast('⚠️ Invalid email format (e.g. user@gmail.com)', 'error'); return; }
      if (!/^\d{10}$/.test(mobile)) { showToast('⚠️ Mobile must be 10 digits', 'error'); return; }
      if (pass.length < 6) { showToast('⚠️ Password must be at least 6 characters', 'error'); return; }
      if (pass.length > 50) { showToast('⚠️ Password is too long', 'error'); return; }

      /*
        BACKEND VALIDATION SUGGESTION (Firebase Authentication):
        try {
          const userCredential = await admin.auth().createUser({
             email: email,
             emailVerified: false,
             phoneNumber: '+91' + mobile,
             password: pass,
             displayName: name,
             disabled: false,
          });
          // Optionally save user details in Firestore backend
        } catch (error) {
          if (error.code === 'auth/invalid-password') {
             // handle error
          }
        }
      */

      const token = btoa(JSON.stringify({ email, role: currentRole, exp: Date.now() + 86400000 }));
      localStorage.setItem('agrihelp_token', token);
      STATE.user = { name, email, role: currentRole };
      launchApp();
    }

    function handleLogout() {
      localStorage.removeItem('agrihelp_token');
      STATE.user = null;
      document.getElementById('app').classList.remove('active');
      document.getElementById('auth-screen').classList.remove('hidden');
      STATE.mapReady = false;
    }

    // ─── APP LAUNCH ───────────────────────────────────────────────
    function launchApp() {
      const role = STATE.user.role;
      STATE.role = role;

      document.getElementById('auth-screen').classList.add('hidden');
      document.getElementById('app').classList.add('active');

      // Update topbar
      document.getElementById('tb-name').textContent = STATE.user.name;
      document.getElementById('tb-avatar').textContent = STATE.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
      const badge = document.getElementById('tb-role');
      badge.textContent = role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer';
      badge.className = 'tb-role-badge' + (role === 'buyer' ? ' buyer' : '');

      // Show/hide dashboard button
      document.getElementById('dash-btn').style.display = role === 'buyer' ? 'block' : 'none';
      document.getElementById('sidebar').style.display = role === 'farmer' ? 'flex' : 'none';

      // Load buyers with distance
      loadBuyersWithDistance();

      // Detect location
      detectLocation();

      // Seed notifications
      seedNotifications();

      // Real-time simulation
      startRealTimeSimulation();
    }

    // ─── GEOLOCATION ─────────────────────────────────────────────
    function detectLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            STATE.farmerLat = pos.coords.latitude;
            STATE.farmerLng = pos.coords.longitude;
            showToast('📍 Location detected!');
            loadBuyersWithDistance();
            initMap();
          },
          () => {
            // Use default (Pune) if permission denied
            showToast('📍 Using default location: Pune, MH');
            initMap();
          }
        );
      } else {
        initMap();
      }
      // Update buyer location display
      document.getElementById('buyer-location-display').textContent =
        `📍 Lat: ${STATE.farmerLat.toFixed(4)}, Lng: ${STATE.farmerLng.toFixed(4)}`;
    }

    // ─── BUYERS + DISTANCE ────────────────────────────────────────
    function loadBuyersWithDistance() {
      STATE.buyers = SEED_BUYERS.map(b => ({
        ...b,
        distance: haversine(STATE.farmerLat, STATE.farmerLng, b.lat, b.lng)
      }));
      applyFilters();
    }

    function applyFilters() {
      const product = document.getElementById('filter-product')?.value || '';
      const maxDist = parseFloat(document.getElementById('filter-distance')?.value || 100);
      const minPrice = parseFloat(document.getElementById('filter-price')?.value || 0);
      const sortBy = document.getElementById('filter-sort')?.value || 'distance';

      let list = STATE.buyers.filter(b => {
        if (product && b.product !== product) return false;
        if (b.distance > maxDist) return false;
        if (b.price < minPrice) return false;
        return true;
      });

      if (sortBy === 'distance') list.sort((a, b) => a.distance - b.distance);
      else if (sortBy === 'price') list.sort((a, b) => b.price - a.price);
      else if (sortBy === 'quantity') list.sort((a, b) => b.qty - a.qty);

      STATE.filteredBuyers = list;
      renderBuyerList();
      renderMap();
      updateStats();
    }

    function resetFilters() {
      document.getElementById('filter-product').value = '';
      document.getElementById('filter-distance').value = 25;
      document.getElementById('filter-price').value = 0;
      document.getElementById('filter-sort').value = 'distance';
      updateRangeLabel(); updatePriceLabel();
      applyFilters();
    }

    function updateRangeLabel() {
      document.getElementById('range-val').textContent = document.getElementById('filter-distance').value;
    }
    function updatePriceLabel() {
      document.getElementById('price-val').textContent = document.getElementById('filter-price').value;
    }

    // ─── BUYER LIST (SIDEBAR) ─────────────────────────────────────
    function renderBuyerList() {
      const list = document.getElementById('buyer-list');
      const label = document.getElementById('buyer-count-label');
      const buyers = STATE.filteredBuyers;

      label.textContent = `${buyers.length} found`;
      if (!list) return;

      if (buyers.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:2rem;font-size:.78rem;color:rgba(148,163,184,.3);">No buyers match your filters</div>';
        return;
      }

      list.innerHTML = buyers.map(b => `
    <div class="buyer-card ${STATE.selectedBuyer?.id === b.id ? 'active' : ''}"
         onclick="selectBuyer(${b.id})">
      <div class="bc-head">
        <div class="bc-avatar">${b.emoji}</div>
        <div style="flex:1">
          <div class="bc-name">${b.name}</div>
          <div class="bc-dist">📏 ${b.distance.toFixed(1)} km away</div>
        </div>
        ${b.urgent ? '<span style="font-size:.62rem;background:rgba(229,62,62,.15);border:1px solid rgba(229,62,62,.3);color:#ff7b7b;padding:2px 7px;border-radius:50px;font-weight:700;">URGENT</span>' : ''}
      </div>
      <div class="bc-chips">
        <span class="bc-chip chip-product">🌾 ${b.product}</span>
        <span class="bc-chip chip-price">₹${b.price.toLocaleString()}/qt</span>
        <span class="bc-chip chip-qty">📦 ${b.qty} qt</span>
      </div>
      <div class="bc-footer">
        ${getConnectionButtonHTML(b.id)}
        <button class="bc-action bc-view" onclick="event.stopPropagation();selectBuyer(${b.id})">View on Map</button>
      </div>
    </div>
  `).join('');
    }

    function updateStats() {
      const buyers = STATE.filteredBuyers;
      document.getElementById('stat-buyers').textContent = buyers.length;
      if (buyers.length > 0) {
        const avg = buyers.reduce((s, b) => s + b.distance, 0) / buyers.length;
        document.getElementById('stat-dist').textContent = avg.toFixed(1) + ' km';
      } else {
        document.getElementById('stat-dist').textContent = '— km';
      }
    }

    // ─── SELECT BUYER ─────────────────────────────────────────────
    function selectBuyer(id) {
      const b = STATE.buyers.find(x => x.id === id);
      if (!b) return;
      STATE.selectedBuyer = b;
      renderBuyerList();

      // Fill detail panel
      document.getElementById('dp-name').textContent = b.name;
      document.getElementById('dp-type').textContent = b.type;
      document.getElementById('dp-avatar').textContent = b.emoji;
      document.getElementById('dp-distance').textContent = `${b.distance.toFixed(2)} km away`;
      document.getElementById('dp-product').textContent = b.product;
      document.getElementById('dp-qty').textContent = `${b.qty} quintals`;
      document.getElementById('dp-price').textContent = `₹${b.price.toLocaleString()}/quintal`;
      document.getElementById('dp-deadline').textContent = b.deadline;

      const actionsContainer = document.getElementById('dp-actions-container');
      const status = STATE.connectionStatus[b.id];
      if (status === 'matched') {
        actionsContainer.innerHTML = `
      <button class="dp-btn dp-btn-primary" onclick="openChat()">💬 Send Message</button>
      <button class="dp-btn dp-btn-secondary" onclick="callBuyer()">📞 Secure Web Call</button>
    `;
      } else if (status === 'pending') {
        actionsContainer.innerHTML = `
      <button class="dp-btn" style="background:rgba(232,160,32,.1);border:1px solid rgba(232,160,32,.25);color:var(--amber-l);cursor:not-allowed;">⏳ Request Pending</button>
    `;
      } else {
        actionsContainer.innerHTML = `
      <button class="dp-btn dp-btn-primary" onclick="openMatchModal(${b.id})">🔗 Connect to Buyer</button>
    `;
      }

      // Stars
      const stars = '★'.repeat(Math.floor(b.rating)) + '☆'.repeat(5 - Math.floor(b.rating));
      document.getElementById('dp-stars').textContent = stars;
      document.getElementById('dp-rating-text').textContent = `${b.rating} · ${b.reviews} reviews`;

      document.getElementById('detail-panel').classList.add('open');
      document.getElementById('chat-name').textContent = b.name;
      document.getElementById('chat-avatar').textContent = b.emoji;

      renderMap(); // highlight selected
    }

    function closeDetail() {
      document.getElementById('detail-panel').classList.remove('open');
      STATE.selectedBuyer = null;
      renderBuyerList();
      renderMap();
    }

    function getConnectionButtonHTML(id) {
      const status = STATE.connectionStatus[id];
      if (status === 'matched') return `<button class="bc-action bc-contact" onclick="event.stopPropagation();openChatForBuyer(${id})">💬 Chat</button>`;
      if (status === 'pending') return `<button class="bc-action" style="background:rgba(232,160,32,.1);border:1px solid rgba(232,160,32,.2);color:var(--amber-l);" onclick="event.stopPropagation();">⏳ Pending</button>`;
      return `<button class="bc-action" style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.3);color:var(--g300);" onclick="event.stopPropagation();openMatchModal(${id})">🔗 Connect</button>`;
    }

    let matchTargetBuyer = null;
    function openMatchModal(id) {
      const b = STATE.buyers.find(x => x.id === id);
      if (!b) return;
      matchTargetBuyer = b;
      document.getElementById('match-buyer-qty').textContent = b.qty;
      document.getElementById('match-buyer-product').textContent = b.product;
      document.getElementById('match-buyer-price').textContent = b.price;
      document.getElementById('match-qty').value = '';
      document.getElementById('match-price').value = '';
      document.getElementById('match-modal').style.display = 'flex';
    }

    function closeMatchModal() {
      document.getElementById('match-modal').style.display = 'none';
      matchTargetBuyer = null;
    }

    function submitMatchRequest() {
      if (!matchTargetBuyer) return;
      const qty = parseInt(document.getElementById('match-qty').value);
      const price = parseInt(document.getElementById('match-price').value);
      if (!qty || !price) {
        showToast('⚠️ Please enter both quantity and price.', 'error');
        return;
      }

      if (price <= matchTargetBuyer.price && qty >= matchTargetBuyer.qty * 0.5) {
        STATE.connectionStatus[matchTargetBuyer.id] = 'matched';
        showToast("🎉 It's a Match! Chat and Call are unlocked.", 'success');
      } else {
        STATE.connectionStatus[matchTargetBuyer.id] = 'pending';
        showToast('📨 Connect Request sent. Waiting for buyer.', '');
      }

      closeMatchModal();
      renderBuyerList();
      if (STATE.selectedBuyer && STATE.selectedBuyer.id === matchTargetBuyer.id) {
        selectBuyer(matchTargetBuyer.id); // re-render detail panel
      }
    }

    // ─── LEAFLET GEOGRAPHICAL MAP ENGINE ────────────────────────────────────────
    let mapInstance = null;
    let farmerMarker = null;
    let buyerMarkers = [];
    let distanceLines = [];

    function initMap() {
      if (mapInstance) mapInstance.remove();

      // Create Leaflet map
      mapInstance = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([STATE.farmerLat, STATE.farmerLng], 12);

      // CartoDB Dark Matter base map for geographic location
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(mapInstance);

      document.getElementById('map-loading').style.display = 'none';
      STATE.mapReady = true;

      // Ensure the map resizes correctly
      setTimeout(() => mapInstance.invalidateSize(), 500);
      window.addEventListener('resize', () => mapInstance.invalidateSize());

      renderMap();
    }

    function resizeCanvas() {
      if (mapInstance) mapInstance.invalidateSize();
    }

    function renderMap() {
      if (!mapInstance) return;

      // Clear old markers and lines
      if (farmerMarker) farmerMarker.remove();
      buyerMarkers.forEach(m => m.remove());
      distanceLines.forEach(l => l.remove());
      buyerMarkers = [];
      distanceLines = [];

      // Draw Farmer Group
      const farmerGrp = L.layerGroup().addTo(mapInstance);

      // Range circle around farmer
      const rangeKm = parseFloat(document.getElementById('filter-distance')?.value || 25);
      L.circle([STATE.farmerLat, STATE.farmerLng], {
        color: 'rgba(16,185,129,0.6)',
        fillColor: 'rgba(16,185,129,0.1)',
        fillOpacity: 1,
        radius: rangeKm * 1000,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(farmerGrp);

      // Farmer custom icon
      const farmerIcon = L.divIcon({
        className: 'leaflet-farmer-icon',
        html: `<div style="background:linear-gradient(135deg,#34d399,#059669);width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 15px rgba(16,185,129,0.8);display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);"><span style="position:absolute;top:-20px;background:rgba(2,11,20,0.85);color:#34d399;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">YOU</span></div>`
      });
      L.marker([STATE.farmerLat, STATE.farmerLng], { icon: farmerIcon }).addTo(farmerGrp);
      farmerMarker = farmerGrp;

      // Draw buyers
      STATE.filteredBuyers.forEach(b => {
        const isSelected = STATE.selectedBuyer?.id === b.id;
        let color = '#2563eb'; let shadow = 'rgba(37,99,235,0.5)';
        if (b.urgent) { color = '#e53e3e'; shadow = 'rgba(229,62,62,0.7)'; }
        else if (b.highValue) { color = '#e8a020'; shadow = 'rgba(232,160,32,0.6)'; }

        if (isSelected) { color = '#f5c35a'; shadow = 'rgba(245,195,90,0.8)'; }

        const size = isSelected ? 24 : 16;
        const border = isSelected ? '2px solid rgba(245,195,90,0.8)' : '2px solid transparent';

        // Line to farmer
        const lineWeight = isSelected ? 2 : 1;
        const lineOpacity = isSelected ? 0.8 : 0.4;
        const line = L.polyline([
          [STATE.farmerLat, STATE.farmerLng],
          [b.lat, b.lng]
        ], {
          color: isSelected ? '#f5c35a' : '#10b981',
          weight: lineWeight,
          opacity: lineOpacity,
          dashArray: '4, 6'
        }).addTo(mapInstance);
        distanceLines.push(line);

        // Distance overlay
        const mx = (STATE.farmerLat + b.lat) / 2;
        const my = (STATE.farmerLng + b.lng) / 2;
        const distIcon = L.divIcon({
          className: 'dist-label',
          html: `<div style="background:rgba(2,11,20,0.8);color:#34d399;font-size:10px;padding:1px 4px;border-radius:3px;font-weight:600;">${b.distance.toFixed(1)}km</div>`
        });
        distanceLines.push(L.marker([mx, my], { icon: distIcon }).addTo(mapInstance));

        // Buyer Marker
        const iconHTML = `
      <div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:0 0 15px ${shadow}; position:relative; transform:translate(-50%,-50%); cursor:pointer;">
        <div style="position:absolute; top:-22px; left:50%; transform:translateX(-50%); background:rgba(2,11,20,0.9); border:1px solid ${isSelected ? '#f5c35a' : 'rgba(16,185,129,0.2)'}; padding:2px 6px; border-radius:4px; color:${isSelected ? '#f5c35a' : '#6ee7b7'}; font-size:10px; font-weight:bold; white-space:nowrap; display:${(isSelected || mapInstance.getZoom() > 12) ? 'block' : 'none'};">
          ${b.name.split(' ')[0]}
        </div>
      </div>
    `;
        const buyerIcon = L.divIcon({
          className: 'leaflet-buyer-icon',
          html: iconHTML
        });

        const marker = L.marker([b.lat, b.lng], { icon: buyerIcon }).addTo(mapInstance);
        marker.on('click', () => selectBuyer(b.id));
        buyerMarkers.push(marker);
      });
    }

    // Map controls
    function zoomIn() { if (mapInstance) mapInstance.zoomIn(); }
    function zoomOut() { if (mapInstance) mapInstance.zoomOut(); }
    function resetView() {
      if (mapInstance) mapInstance.setView([STATE.farmerLat, STATE.farmerLng], 12);
      document.getElementById('filter-distance').value = 25;
      applyFilters();
    }
    function centerOnFarmer() {
      if (mapInstance) mapInstance.setView([STATE.farmerLat, STATE.farmerLng], Math.max(mapInstance.getZoom(), 12));
      showToast('📍 Centered on your location');
    }
    function toggleSidebar() {
      const sb = document.getElementById('sidebar');
      sb.classList.toggle('collapsed');
      setTimeout(() => { if (mapInstance) mapInstance.invalidateSize(true); }, 300);
    }

    // ─── BUYER DASHBOARD ──────────────────────────────────────────
    function toggleBuyerDash() {
      STATE.buyerDashOpen = !STATE.buyerDashOpen;
      document.getElementById('buyer-dash').classList.toggle('active', STATE.buyerDashOpen);
      updateDashStats();
    }

    function updateDashStats() {
      document.getElementById('dash-posts').textContent = STATE.postedRequirements.length;
      document.getElementById('dash-contacts').textContent = STATE.stats.contacts;
      document.getElementById('dash-saved').textContent = STATE.stats.distanceSaved + ' km';
      document.getElementById('dash-rating').textContent = STATE.stats.rating || '—';
    }

    function postRequirement() {
      const product = document.getElementById('pf-product').value;
      const qty = document.getElementById('pf-qty').value;
      const price = document.getElementById('pf-price').value;
      const phone = document.getElementById('pf-phone').value;
      const deadline = document.getElementById('pf-deadline').value;
      const type = document.getElementById('pf-type').value;

      if (!product || !qty || !price || !phone) {
        showToast('⚠️ Please fill all required fields', 'error'); return;
      }

      const req = {
        id: Date.now(), product, qty: parseInt(qty), price: parseInt(price),
        phone, deadline, type, lat: STATE.farmerLat, lng: STATE.farmerLng,
        postedAt: new Date().toLocaleTimeString()
      };

      STATE.postedRequirements.push(req);
      STATE.stats.contacts++;
      STATE.stats.distanceSaved += Math.floor(Math.random() * 30 + 10);

      // Add to map buyers (simulating real-time posting)
      const newBuyer = {
        id: req.id, name: STATE.user.name, emoji: STATE.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U', type, product, qty: req.qty,
        price: req.price, lat: req.lat, lng: req.lng, phone,
        deadline: deadline || 'Open', rating: 4.0, reviews: 0, urgent: false, highValue: req.price > 3000
      };
      STATE.buyers.push({ ...newBuyer, distance: 0 });

      renderPostedList();
      updateDashStats();
      applyFilters();

      // Clear form
      ['pf-product', 'pf-qty', 'pf-price', 'pf-phone', 'pf-deadline'].forEach(id => {
        const el = document.getElementById(id);
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
      });

      showToast('✅ Requirement posted! Farmers nearby are being notified.');

      // Notify all farmers (simulated push)
      addNotification(`🔔 New buyer nearby: ${product} — ₹${parseInt(price).toLocaleString()}/qt`, true);
    }

    function renderPostedList() {
      const container = document.getElementById('posted-items-list');
      if (STATE.postedRequirements.length === 0) {
        container.innerHTML = '<div style="font-size:.8rem;color:rgba(148,163,184,.3);text-align:center;padding:2rem;">No requirements posted yet</div>';
        return;
      }
      container.innerHTML = STATE.postedRequirements.map(r => `
    <div class="posted-item">
      <span class="pi-emoji" style="border:1px solid rgba(16,185,129,.3); width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-size:11px; font-weight:700; color:var(--g300);">REQ</span>
      <div class="pi-info">
        <div class="pi-title">${r.product} — ${r.qty} quintals</div>
        <div class="pi-meta">₹${r.price.toLocaleString()}/qt · ${r.type} · Posted at ${r.postedAt}</div>
      </div>
      <span class="pi-badge">Active</span>
      <button class="pi-del" onclick="deletePost(${r.id})">🗑</button>
    </div>
  `).join('');
    }

    function deletePost(id) {
      STATE.postedRequirements = STATE.postedRequirements.filter(r => r.id !== id);
      STATE.buyers = STATE.buyers.filter(b => b.id !== id);
      renderPostedList(); applyFilters(); updateDashStats();
      showToast('🗑 Requirement removed');
    }

    // ─── CHAT ─────────────────────────────────────────────────────
    function openChat() {
      if (!STATE.selectedBuyer) return;
      document.getElementById('chat-modal').classList.add('open');
      STATE.chatOpen = true;
      STATE.stats.contacts = Math.max(STATE.stats.contacts, 1) + 1;
    }

    function openChatForBuyer(id) {
      selectBuyer(id);
      setTimeout(() => openChat(), 100);
    }

    function closeChat() {
      document.getElementById('chat-modal').classList.remove('open');
      STATE.chatOpen = false;
    }

    function chatEnter(e) { if (e.key === 'Enter') sendChatMessage(); }

    function sendChatMessage() {
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;

      const msgs = document.getElementById('chat-messages');
      msgs.innerHTML += `<div class="msg me">${escHtml(text)}</div>`;
      input.value = '';
      msgs.scrollTop = msgs.scrollHeight;

      // Simulated reply
      setTimeout(() => {
        const replies = [
          'Yes, we are interested! What is the quality grade?',
          'Can you deliver within 3 days?',
          'We can offer ₹200 more for certified organic produce.',
          'Please send a sample first. We will finalize quantity.',
          'Our warehouse is ready. When can you deliver?',
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        msgs.innerHTML += `<div class="msg them">${reply}</div>`;
        msgs.scrollTop = msgs.scrollHeight;
      }, 1200 + Math.random() * 800);
    }

    function callBuyer() {
      if (!STATE.selectedBuyer) return;
      document.getElementById('call-modal').style.display = 'flex';
      document.getElementById('call-name').textContent = STATE.selectedBuyer.name;
      document.getElementById('call-avatar').textContent = STATE.selectedBuyer.emoji;
      document.getElementById('call-status').textContent = 'Ringing...';

      if (window.callTimeout) clearTimeout(window.callTimeout);
      window.callTimeout = setTimeout(() => {
        document.getElementById('call-status').textContent = '00:01 - Connected';
        document.getElementById('call-avatar').style.animation = 'none';
      }, 3000);
    }

    function endCall() {
      document.getElementById('call-modal').style.display = 'none';
      if (window.callTimeout) clearTimeout(window.callTimeout);
      showToast('Call ended.', '');
    }

    function bookColdStorage() {
      showToast('✅ Cold storage booking request sent!', 'success');
    }

    function toggleColdStorage() {
      const coldDash = document.getElementById('cold-storage-dash');
      coldDash.classList.toggle('active');
    }

    function submitFertilizerForm(event) {
      event.preventDefault();
      const name = document.getElementById('add-fert-name').value.trim();
      let img = document.getElementById('add-fert-img').value.trim();
      const price = document.getElementById('add-fert-price').value.trim();
      const desc = document.getElementById('add-fert-desc').value.trim();

      if (!name || !price || !desc) {
        showToast('⚠️ Please fill in product name, price, and description', 'error'); return;
      }

      if (!img) {
        // fallback image
        img = 'https://images.unsplash.com/photo-1592982537447-6f2a6a0a0c8b?auto=format&fit=crop&q=80&w=400';
      }

      const container = document.getElementById('fert-list-container');
      const cardHTML = `
    <div class="buyer-card" style="animation: panelIn 0.3s ease;">
      <div style="height:140px; border-radius:var(--r-sm); margin-bottom:.8rem; overflow:hidden; border:1px solid rgba(16,185,129,.15);">
        <img src="${escHtml(img)}" alt="${escHtml(name)}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div class="bc-head" style="margin-bottom:0.3rem;">
        <div style="flex:1">
          <div class="bc-name">${escHtml(name)}</div>
        </div>
      </div>
      <div style="font-size:0.75rem; color:rgba(148,163,184,.6); margin-bottom:0.6rem; min-height: 2.5em;">${escHtml(desc)}</div>
      <div class="bc-chips">
        <span class="bc-chip chip-price">₹${Math.floor(price).toLocaleString()}</span>
      </div>
      <div class="bc-footer"><button class="bc-action bc-contact" onclick="bookFertilizer()">Order Now</button></div>
    </div>
  `;
      container.insertAdjacentHTML('afterbegin', cardHTML);
      showToast('✅ Fertilizer product added successfully!', 'success');

      // clear form
      document.getElementById('add-fert-name').value = '';
      document.getElementById('add-fert-img').value = '';
      document.getElementById('add-fert-price').value = '';
      document.getElementById('add-fert-desc').value = '';
    }

    function bookFertilizer() {
      showToast('✅ Fertilizer order placed successfully!', 'success');
    }

    function toggleFertilizerDash() {
      const fertDash = document.getElementById('fertilizer-dash');
      fertDash.classList.toggle('active');
    }

    // ─── NOTIFICATIONS ────────────────────────────────────────────
    function seedNotifications() {
      STATE.notifications = [
        { text: 'New buyer posted: 500 qt Tomatoes at ₹2,400/qt near you!', time: '2 min ago', unread: true },
        { text: 'Raj Exports updated price to ₹3,200 for Rice', time: '15 min ago', unread: true },
        { text: 'Hotel Grand Hyatt needs Potatoes urgently — 80 qt', time: '32 min ago', unread: true },
      ];
      renderNotifications();
    }

    function addNotification(text, unread = true) {
      STATE.notifications.unshift({ text, time: 'Just now', unread });
      renderNotifications();
      const count = STATE.notifications.filter(n => n.unread).length;
      document.getElementById('notif-count').textContent = count;
    }

    function renderNotifications() {
      const list = document.getElementById('notif-list');
      const count = STATE.notifications.filter(n => n.unread).length;
      document.getElementById('notif-count').textContent = count;

      list.innerHTML = STATE.notifications.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}">
      <span class="notif-icon">🔔</span>
      <div>
        <div class="notif-text">${escHtml(n.text)}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
    }

    function toggleNotifications() {
      STATE.notifOpen = !STATE.notifOpen;
      document.getElementById('notif-panel').classList.toggle('open', STATE.notifOpen);
      if (STATE.notifOpen) {
        STATE.notifications.forEach(n => n.unread = false);
        document.getElementById('notif-count').textContent = '0';
      }
    }

    // ─── RATING SYSTEM ────────────────────────────────────────────
    function rateBuyer(stars) {
      document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < stars));
      showToast(`⭐ Rated ${stars} star${stars > 1 ? 's' : ''}! Thank you.`);
      if (STATE.selectedBuyer) {
        STATE.selectedBuyer.rating = ((STATE.selectedBuyer.rating * STATE.selectedBuyer.reviews + stars) / (STATE.selectedBuyer.reviews + 1)).toFixed(1);
        STATE.selectedBuyer.reviews++;
        STATE.stats.rating = stars;
      }
    }

    // ─── REAL-TIME SIMULATION ────────────────────────────────────
    function startRealTimeSimulation() {
      // Simulate new buyer appearing every 30 seconds
      setInterval(() => {
        const products = ['Rice', 'Wheat', 'Tomatoes', 'Onions', 'Potatoes', 'Soybean'];
        const types = ['Wholesaler', 'Retailer', 'Exporter', 'Restaurant'];
        const names = ['Metro Traders', 'Fresh Hub', 'City Mart', 'Farm Direct', 'Green Buyers'];
        const p = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 400 + 50);
        const price = Math.floor(Math.random() * 3000 + 1200);
        const name = names[Math.floor(Math.random() * names.length)];
        const latOff = (Math.random() - 0.5) * 0.12;
        const lngOff = (Math.random() - 0.5) * 0.12;

        const newBuyer = {
          id: Date.now(), name, emoji: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          type: types[Math.floor(Math.random() * types.length)],
          product: p, qty, price,
          lat: STATE.farmerLat + latOff, lng: STATE.farmerLng + lngOff,
          phone: '98' + Math.floor(Math.random() * 1e8).toString().padStart(8, '0'),
          deadline: '2026-04-30', rating: +(Math.random() * 1.5 + 3.5).toFixed(1), reviews: Math.floor(Math.random() * 20),
          urgent: Math.random() > 0.75, highValue: price > 3000,
          distance: 0
        };
        newBuyer.distance = haversine(STATE.farmerLat, STATE.farmerLng, newBuyer.lat, newBuyer.lng);
        STATE.buyers.push(newBuyer);

        addNotification(`🆕 New buyer: ${name} needs ${qty} qt ${p} @ ₹${price.toLocaleString()}/qt`);
        applyFilters();
        showToast(`🔔 New buyer posted: ${p} — ${qty} qt`);
      }, 30000);

      // Animate the Live indicator
      let liveBlink = true;
      setInterval(() => {
        liveBlink = !liveBlink;
        const el = document.getElementById('stat-live');
        if (el) el.querySelector('span').textContent = liveBlink ? '🟢 Live' : '🔵 Live';
      }, 1500);
    }

    // ─── UTILITIES ────────────────────────────────────────────────
    function showToast(msg, type = '') {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show' + (type ? ' ' + type : '');
      clearTimeout(t._timeout);
      t._timeout = setTimeout(() => t.classList.remove('show'), 3500);
    }

    function escHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ─── AUTO-LOGIN CHECK ─────────────────────────────────────────
    window.addEventListener('DOMContentLoaded', () => {
      const token = localStorage.getItem('agrihelp_token');
      if (token) {
        try {
          const data = JSON.parse(atob(token));
          if (data.exp > Date.now()) {
            const name = data.email.split('@')[0].replace(/\d/g, '').replace(/^./, c => c.toUpperCase()) || 'User';
            STATE.user = { name, email: data.email, role: data.role };
            launchApp();
            return;
          }
        } catch { localStorage.removeItem('agrihelp_token'); }
      }
      // Animate map canvas placeholder
      const canvas = document.getElementById('map');
      if (!canvas) return;
    });

    // Polyfill roundRect for older browsers
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
      };
    }
// ─── GLOBE.GL ANIMATION ────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const globeContainer = document.getElementById('globeViz');
  if (globeContainer) {
    const globe = Globe()(globeContainer)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .backgroundColor('rgba(0,0,0,1)')
      .width(window.innerWidth)
      .height(window.innerHeight);

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    globe.controls().enableZoom = false; // Background locked
    globe.camera().position.z = 250; // Zoom in slightly

    window.addEventListener('resize', () => {
      globe.width(window.innerWidth);
      globe.height(window.innerHeight);
    });
  }
});
