const DB = {
  get: (key) => JSON.parse(localStorage.getItem(key)) || [],
  set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
  generateInvoice: () => {
    let count = parseInt(localStorage.getItem('gymInvCount') || '0') + 1;
    localStorage.setItem('gymInvCount', count);
    return `GYM-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
  }
};

const UI = {
  toast: (msg, type = 'success') => {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    let icon = 'check-circle';
    if(type==='error') icon = 'circle-xmark';
    if(type==='warning') icon = 'triangle-exclamation';
    if(type==='info') icon = 'circle-info';
    t.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  },
  openModal: (id) => {
    document.getElementById(id).classList.add('active');
  },
  closeModal: (id) => {
    document.getElementById(id).classList.remove('active');
  },
  formatDate: (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
  },
  confirm: (msg, cb) => {
    if(confirm(msg)) cb();
  }
};

const Auth = {
  init: () => {
    const session = localStorage.getItem('gymSession');
    if (session) {
      document.getElementById('auth-view').style.display = 'none';
      document.getElementById('app-view').style.display = 'flex';
      App.loadData();
    } else {
      document.getElementById('auth-view').style.display = 'flex';
      document.getElementById('app-view').style.display = 'none';
    }
    
    document.getElementById('login-form').onsubmit = (e) => {
      e.preventDefault();
      const u = document.getElementById('login-user').value;
      const p = document.getElementById('login-pass').value;
      const r = document.getElementById('login-remember').checked;
      
      const set = DB.get('gymSettings');
      let admins = set.admins || [{name:'Super Admin', user:'admin', pass:'gym@2024'}];
      const validAdmin = admins.find(a => a.user === u && a.pass === p);
      
      if(validAdmin) {
        localStorage.setItem('gymSession', JSON.stringify({ r: r ? 'persistent' : 'session', user: validAdmin.user, name: validAdmin.name }));
        document.getElementById('auth-view').style.display = 'none';
        document.getElementById('app-view').style.display = 'flex';
        App.loadData();
      } else {
        const card = document.getElementById('login-card');
        card.classList.add('error');
        document.getElementById('login-error').style.display = 'block';
        setTimeout(() => card.classList.remove('error'), 300);
      }
    };
    
    document.getElementById('logout-btn').onclick = () => {
      localStorage.removeItem('gymSession');
      location.reload();
    };

    document.getElementById('toggle-password').onclick = (e) => {
      const p = document.getElementById('login-pass');
      if(p.type === 'password') {
        p.type = 'text';
        e.target.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        p.type = 'password';
        e.target.classList.replace('fa-eye-slash', 'fa-eye');
      }
    };
  }
};

const Seed = {
  run: () => {
    if(localStorage.getItem('gymSeeded')) return;
    
    const plans = [
      { id: DB.generateId(), name: 'Basic Monthly', duration: 30, price: 3000, features: ['Gym Access'], color: '#3b82f6', isActive: true },
      { id: DB.generateId(), name: 'Premium Monthly', duration: 30, price: 5000, features: ['Gym Access', 'Classes'], color: '#6c63ff', isActive: true },
      { id: DB.generateId(), name: 'Quarterly', duration: 90, price: 12000, features: ['Gym Access', 'Trainer'], color: '#f59e0b', isActive: true },
      { id: DB.generateId(), name: 'Annual', duration: 365, price: 35000, features: ['All VIP Perks'], color: '#22c55e', isActive: true }
    ];
    DB.set('gymPlans', plans);
    
    const members = [];
    const today = new Date();
    const names = ['Kamau Mwangi', "Wanjiru Ndung'u", 'Ochieng Odhiambo', 'Aoko Anyango', 'Kipchoge Keino', 'Mutisya Muli', 'Muthoni Njeri', 'Hassan Ali'];
    for(let i=1; i<=8; i++) {
      const p = plans[i % 4];
      let start = new Date(today);
      start.setDate(start.getDate() - Math.floor(Math.random() * 60));
      let end = new Date(start);
      end.setDate(end.getDate() + p.duration);
      
      let status = 'Active';
      if(end < today) status = 'Expired';
      if(i===8) status = 'Suspended';
      
      members.push({
        id: DB.generateId(),
        name: names[i-1],
        age: 20 + Math.floor(Math.random() * 30),
        gender: i%2===0 ? 'Female' : 'Male',
        phone: `072200000${i}`,
        email: `member${i}@example.com`,
        membershipType: p.name,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        photo: null,
        joinedAt: new Date().toISOString(),
        status: status
      });
    }
    DB.set('gymMembers', members);
    
    const payments = [];
    members.forEach(m => {
      payments.push({
        id: DB.generateId(),
        memberId: m.id,
        memberName: m.name,
        planName: m.membershipType,
        amount: plans.find(p=>p.name===m.membershipType)?.price || 0,
        paymentDate: m.startDate,
        method: 'M-Pesa',
        status: m.status === 'Active' ? 'Paid' : (Math.random()>0.5?'Pending':'Overdue'),
        invoiceNo: DB.generateInvoice()
      });
    });
    DB.set('gymPayments', payments);
    localStorage.setItem('gymSeeded', 'true');
  }
};

const WhatsApp = {
  formatPhone: (phone) => {
    let p = phone.replace(/\D/g, '');
    if(p.startsWith('0')) p = '254' + p.substring(1);
    else if(p.startsWith('7') || p.startsWith('1')) p = '254' + p;
    return p;
  },
  send: (phone, msg) => {
    const f = WhatsApp.formatPhone(phone);
    window.open(`https://wa.me/${f}?text=${encodeURIComponent(msg)}`, '_blank');
  }
};

const Shop = {
  cart: [],
  render: () => {
    const items = DB.get('gymInventory');
    const c = document.getElementById('shop-items-grid');
    c.innerHTML = items.length ? '' : '<div style="grid-column: span 3; text-align:center; padding:20px; color:var(--text-muted)">No items found.</div>';
    items.forEach((i, idx) => {
       c.innerHTML += `<div class="card pos-item-card" style="position:relative" onclick="Shop.addToCart('${i.id}')">
         <button class="btn btn-danger btn-icon" style="position:absolute; top:8px; right:8px; width:24px; height:24px; font-size:10px" onclick="event.stopPropagation(); Shop.deleteItem('${i.id}')"><i class="fa-solid fa-trash"></i></button>
         <i class="fa-solid fa-box" style="margin-top:8px"></i>
         <div style="font-weight:600">${i.name}</div>
         <div style="color:var(--text-secondary); font-size:12px;">Stock: ${i.stock}</div>
         <div style="color:var(--accent); font-weight:700;">Ksh ${i.price}</div>
       </div>`;
    });
    Shop.renderCart();
  },
  deleteItem: (id) => {
    UI.confirm('Delete this item completely?', () => {
       let items = DB.get('gymInventory');
       items = items.filter(x => x.id !== id);
       DB.set('gymInventory', items);
       UI.toast('Item deleted');
       Shop.render();
    });
  },
  renderCart: () => {
     const c = document.getElementById('shop-cart-list');
     c.innerHTML = '';
     let tot = 0;
     Shop.cart.forEach((i, idx) => {
        tot += i.price * i.qty;
        c.innerHTML += `<div class="cart-item">
          <div><div style="font-weight:600">${i.name}</div><div style="font-size:12px; color:var(--text-secondary)">Ksh ${i.price} x ${i.qty}</div></div>
          <div><div style="font-weight:700">Ksh ${i.price * i.qty}</div><button class="btn btn-danger btn-sm mt-2" style="padding:4px 8px" onclick="Shop.cart.splice(${idx},1); Shop.renderCart()"><i class="fa-solid fa-trash"></i></button></div>
        </div>`;
     });
     document.getElementById('shop-cart-total').innerText = 'Ksh ' + tot;
  },
  addToCart: (id) => {
     const items = DB.get('gymInventory');
     const it = items.find(x=>x.id===id);
     if(!it) return;
     if(it.stock <= 0) { UI.toast('Out of stock', 'error'); return; }
     const ex = Shop.cart.find(x=>x.id===id);
     if(ex) ex.qty++; else Shop.cart.push({ ...it, qty: 1 });
     Shop.renderCart();
  },
  checkout: () => {
     if(!Shop.cart.length) return;
     const items = DB.get('gymInventory');
     let pays = DB.get('gymPayments');
     let tot = 0;
     Shop.cart.forEach(c => {
        tot += c.price * c.qty;
        const it = items.find(x=>x.id===c.id);
        if(it) it.stock -= c.qty;
     });
     pays.push({
        id: DB.generateId(), memberId: 'walk-in', memberName: 'Store Sale (POS)',
        planName: 'POS Item', amount: tot, paymentDate: new Date().toISOString().split('T')[0],
        method: 'M-Pesa', status: 'Paid', invoiceNo: DB.generateInvoice()
     });
     DB.set('gymInventory', items);
     DB.set('gymPayments', pays);
     Shop.cart = [];
     UI.toast('Sale Processed successfully!');
     Shop.render();
     Dashboard.render();
     Payments.render();
  },
  openAddItemModal: () => { document.getElementById('item-form').reset(); UI.openModal('add-item-modal'); },
  saveItem: () => {
    if(!document.getElementById('item-form').checkValidity()) { UI.toast('Fill required fields', 'error'); return;}
    const items = DB.get('gymInventory');
    items.push({ id: DB.generateId(), name: document.getElementById('item-name').value, price: parseFloat(document.getElementById('item-price').value), stock: parseInt(document.getElementById('item-stock').value) });
    DB.set('gymInventory', items);
    UI.closeModal('add-item-modal'); UI.toast('Item added');
    Shop.render();
  }
};

const Classes = {
  render: () => {
     const cls = DB.get('gymClasses');
     const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
     days.forEach(d => {
        const col = document.getElementById('sched-'+d);
        if(!col) return;
        col.innerHTML = `<div class="day-header">${d}</div>` + cls.filter(c=>c.day===d).sort((a,b)=>a.time.localeCompare(b.time)).map(c => `
           <div class="class-card mt-2" style="--class-color:${c.color||'#6c63ff'}" onclick="Classes.deletePrompt('${c.id}')">
             <div style="font-weight:700">${c.name}</div>
             <div style="color:var(--text-secondary); font-size:12px">${c.time}</div>
             <div style="font-size:11px; margin-top:4px"><i class="fa-solid fa-user-ninja"></i> ${c.trainer||'TBA'}</div>
           </div>
        `).join('');
     });
  },
  openAddModal: () => { document.getElementById('class-form').reset(); UI.openModal('add-class-modal'); },
  save: () => {
    if(!document.getElementById('class-form').checkValidity()) { UI.toast('Fill details', 'error'); return; }
    const cls = DB.get('gymClasses');
    cls.push({ id: DB.generateId(), name: document.getElementById('class-name').value, day: document.getElementById('class-day').value, time: document.getElementById('class-time').value, trainer: document.getElementById('class-trainer').value, color: document.getElementById('class-color').value });
    DB.set('gymClasses', cls);
    UI.closeModal('add-class-modal'); UI.toast('Class scheduled');
    Classes.render();
  },
  deletePrompt: (id) => {
    UI.confirm('Are you sure you want to delete this class?', () => {
       DB.set('gymClasses', DB.get('gymClasses').filter(c=>c.id!==id));
       UI.toast('Class removed'); Classes.render();
    });
  }
};

const ChartsObj = { rev: null, grow: null };

const Dashboard = {
  render: () => {
    const mems = DB.get('gymMembers');
    const pays = DB.get('gymPayments');
    const atts = DB.get('gymAttendance');
    const todayStr = new Date().toISOString().split('T')[0];
    
    const activeMems = mems.filter(m => m.status === 'Active' && m.endDate >= todayStr).length;
    
    let monthRev = 0;
    const cm = new Date().getMonth();
    const cy = new Date().getFullYear();
    pays.forEach(p => {
      const d = new Date(p.paymentDate);
      if(d.getMonth() === cm && d.getFullYear() === cy && p.status==='Paid') monthRev += p.amount;
    });
    
    const todayAtt = atts.filter(a => a.date === todayStr).length;
    
    document.getElementById('kpi-total-members').innerText = mems.length;
    document.getElementById('kpi-active-memberships').innerText = activeMems;
    document.getElementById('kpi-monthly-rev').innerText = 'Ksh ' + monthRev.toFixed(2);
    document.getElementById('kpi-today-att').innerText = todayAtt;

    Dashboard.renderCharts(pays, mems);
    Dashboard.renderRecentPays(pays);
  },
  renderCharts: (pays, mems) => {
    const months = [];
    const revData = [];
    const growData = [];
    for(let i=5; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('default', { month: 'short' }));
      
      let r = 0;
      pays.forEach(p => {
        const pd = new Date(p.paymentDate);
        if(pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear() && p.status==='Paid') {
          r += p.amount;
        }
      });
      revData.push(r);
      
      let c = 0;
      mems.forEach(m => {
        const jd = new Date(m.joinedAt || m.startDate);
        if(jd <= d) c++;
      });
      growData.push(c);
    }

    const c1 = document.getElementById('revChart').getContext('2d');
    if(ChartsObj.rev) ChartsObj.rev.destroy();
    ChartsObj.rev = new Chart(c1, {
      type: 'bar',
      data: { labels: months, datasets: [{ label: 'Revenue (Ksh)', data: revData, backgroundColor: '#6c63ff', borderRadius: 4 }] },
      options: { responsive: true, color: '#94a3b8', scales: { y: { beginAtZero: true } } }
    });

    const c2 = document.getElementById('growthChart').getContext('2d');
    if(ChartsObj.grow) ChartsObj.grow.destroy();
    ChartsObj.grow = new Chart(c2, {
      type: 'line',
      data: { labels: months, datasets: [{ label: 'Members', data: growData, borderColor: '#22c55e', tension: 0.3, fill: true, backgroundColor: 'rgba(34,197,94,0.1)' }] },
      options: { responsive: true }
    });
  },
  renderRecentPays: (pays) => {
    const tbody = document.querySelector('#dash-payments-table tbody');
    tbody.innerHTML = '';
    pays.sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate)).slice(0,5).forEach(p => {
      let statClass = p.status==='Paid'?'status-active':(p.status==='Pending'?'status-pending':'status-expired');
      tbody.innerHTML += `<tr>
        <td data-label="Member">${p.memberName}</td>
        <td data-label="Plan">${p.planName}</td>
        <td data-label="Amount">Ksh ${p.amount.toFixed(2)}</td>
        <td data-label="Date">${p.paymentDate}</td>
        <td data-label="Status"><span class="status-badge ${statClass}">${p.status}</span></td>
      </tr>`;
    });
  }
};

const Members = {
  page: 1, limit: 10,
  render: () => {
    const mems = DB.get('gymMembers');
    const search = document.getElementById('member-search').value.toLowerCase();
    const st = document.getElementById('member-filter-status').value;
    const pl = document.getElementById('member-filter-plan').value;
    
    let filtered = mems.filter(m => {
      let match = true;
      if(search && !(m.name.toLowerCase().includes(search) || m.phone.includes(search))) match = false;
      if(st !== 'All' && m.status !== st) match = false;
      if(pl !== 'All' && m.membershipType !== pl) match = false;
      return match;
    });
    
    filtered.sort((a,b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0));
    
    const tbody = document.querySelector('#members-table tbody');
    tbody.innerHTML = '';
    const start = (Members.page - 1) * Members.limit;
    const end = start + Members.limit;
    
    filtered.slice(start, end).forEach(m => {
      let statClass = m.status==='Active'?'status-active':(m.status==='Expired'?'status-expired':'status-suspended');
      let avatar = m.photo ? `<img src="${m.photo}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">` : `<div class="avatar" style="width:32px;height:32px;font-size:12px">${m.name[0]}</div>`;
      
      tbody.innerHTML += `<tr>
        <td data-label="Member"><div class="flex items-center gap-4">${avatar} <span style="font-weight:500">${m.name}</span></div></td>
        <td data-label="Contact">${m.phone}<br><small style="color:var(--text-muted)">${m.email}</small></td>
        <td data-label="Plan">${m.membershipType}</td>
        <td data-label="Start">${m.startDate}</td>
        <td data-label="End">${m.endDate}</td>
        <td data-label="Status"><span class="status-badge ${statClass}">${m.status}</span></td>
        <td data-label="Actions">
          <button class="btn btn-secondary btn-sm" onclick="Members.edit('${m.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="Members.delete('${m.id}')">Delete</button>
        </td>
      </tr>`;
    });
    
    document.getElementById('mem-page-info').innerText = `Page ${Members.page} of ${Math.ceil(filtered.length/Members.limit) || 1}`;
  },
  openAddModal: () => {
    document.getElementById('member-form').reset();
    document.getElementById('mem-id').value = '';
    document.getElementById('member-modal-title').innerText = 'Add Member';
    document.getElementById('mem-photo-preview').style.display = 'none';
    document.getElementById('mem-photo-preview').src = '';
    document.getElementById('mem-photo-placeholder').style.display = 'inline';
    
    const plans = DB.get('gymPlans');
    const sel = document.getElementById('mem-plan');
    sel.innerHTML = plans.map(p => `<option value="${p.name}" data-dur="${p.duration}">${p.name}</option>`).join('');
    
    const pm = document.getElementById('member-filter-plan');
    if(pm.options.length <= 1) {
       pm.innerHTML = '<option value="All">All Plans</option>' + plans.map(p=>`<option>${p.name}</option>`).join('');
    }
    
    document.getElementById('mem-start').value = new Date().toISOString().split('T')[0];
    Members.autoCalcEndDate();
    UI.openModal('add-member-modal');
  },
  autoCalcEndDate: () => {
    const sel = document.getElementById('mem-plan');
    const opt = sel.options[sel.selectedIndex];
    if(!opt) return;
    const dur = parseInt(opt.getAttribute('data-dur') || '30');
    const start = document.getElementById('mem-start').value;
    if(start) {
      let d = new Date(start);
      d.setDate(d.getDate() + dur);
      document.getElementById('mem-end').value = d.toISOString().split('T')[0];
    }
  },
  previewPhoto: (e) => {
    const file = e.target.files[0];
    if(file) {
      const fr = new FileReader();
      fr.onload = (ev) => {
        const img = document.getElementById('mem-photo-preview');
        img.src = ev.target.result;
        img.style.display = 'block';
        document.getElementById('mem-photo-placeholder').style.display = 'none';
      };
      fr.readAsDataURL(file);
    }
  },
  save: () => {
    if(!document.getElementById('member-form').checkValidity()) {
      UI.toast('Please fill all required fields correctly', 'error'); return;
    }
    const mems = DB.get('gymMembers');
    const id = document.getElementById('mem-id').value || DB.generateId();
    const photoSrc = document.getElementById('mem-photo-preview').src;
    
    let isNew = !document.getElementById('mem-id').value;
    
    const end = document.getElementById('mem-end').value;
    let stat = 'Active';
    if(new Date(end) < new Date()) stat = 'Expired';
    
    const mm = {
      id: id,
      name: document.getElementById('mem-name').value,
      phone: document.getElementById('mem-phone').value,
      email: document.getElementById('mem-email').value,
      gender: document.getElementById('mem-gender').value,
      age: parseInt(document.getElementById('mem-age').value),
      membershipType: document.getElementById('mem-plan').value,
      startDate: document.getElementById('mem-start').value,
      endDate: end,
      photo: photoSrc.length > 100 ? photoSrc : null,
      status: stat,
      joinedAt: isNew ? new Date().toISOString() : mems.find(m=>m.id===id).joinedAt
    };
    
    if(isNew) mems.push(mm);
    else Object.assign(mems.find(m=>m.id===id), mm);
    
    DB.set('gymMembers', mems);
    UI.closeModal('add-member-modal');
    UI.toast('Member saved successfully');
    Members.render();
    Dashboard.render();
    Notifications.runChecks();
  },
  edit: (id) => {
    const m = DB.get('gymMembers').find(x=>x.id===id);
    if(!m) return;
    Members.openAddModal();
    document.getElementById('member-modal-title').innerText = 'Edit Member';
    document.getElementById('mem-id').value = m.id;
    document.getElementById('mem-name').value = m.name;
    document.getElementById('mem-phone').value = m.phone;
    document.getElementById('mem-email').value = m.email;
    document.getElementById('mem-gender').value = m.gender;
    document.getElementById('mem-age').value = m.age;
    document.getElementById('mem-plan').value = m.membershipType;
    document.getElementById('mem-start').value = m.startDate;
    document.getElementById('mem-end').value = m.endDate;
    if(m.photo) {
      document.getElementById('mem-photo-preview').src = m.photo;
      document.getElementById('mem-photo-preview').style.display = 'block';
      document.getElementById('mem-photo-placeholder').style.display = 'none';
    }
  },
  delete: (id) => {
    UI.confirm('Are you sure you want to delete this member?', () => {
      let m = DB.get('gymMembers');
      m = m.filter(x => x.id !== id);
      DB.set('gymMembers', m);
      UI.toast('Member deleted');
      Members.render();
      Dashboard.render();
    });
  }
};

const Plans = {
  render: () => {
    const plans = DB.get('gymPlans');
    const c = document.getElementById('plans-container');
    c.innerHTML = '';
    plans.forEach(p => {
       c.innerHTML += `<div class="card plan-card" style="--plan-color: ${p.color}">
         <h3>${p.name}</h3>
         <div class="plan-price">Ksh ${p.price.toFixed(2)}</div>
         <div class="mb-4"><span class="status-badge" style="background:#333;color:#fff">${p.duration} Days</span></div>
         <ul class="plan-features">
           ${p.features.map(f=>`<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
         </ul>
         <div class="flex gap-4 mt-4">
           <button class="btn btn-secondary w-full" onclick="Plans.edit('${p.id}')">Edit</button>
           <button class="btn btn-danger w-full" onclick="Plans.delete('${p.id}')">Delete</button>
         </div>
       </div>`;
    });
  },
  openPlanModal: () => {
    document.getElementById('plan-form').reset();
    document.getElementById('plan-id').value = '';
    document.getElementById('plan-modal-title').innerText = 'Add Plan';
    UI.openModal('plan-modal');
  },
  save: () => {
     if(!document.getElementById('plan-form').checkValidity()) { UI.toast('Fill all required fields','error'); return; }
     const plans = DB.get('gymPlans');
     const id = document.getElementById('plan-id').value || DB.generateId();
     const pl = {
       id,
       name: document.getElementById('pl-name').value,
       duration: parseInt(document.getElementById('pl-dur').value),
       price: parseFloat(document.getElementById('pl-price').value),
       color: document.getElementById('pl-color').value,
       features: document.getElementById('pl-feat').value.split(',').map(s=>s.trim()).filter(s=>s),
       isActive: true
     };
     if(!document.getElementById('plan-id').value) plans.push(pl);
     else Object.assign(plans.find(p=>p.id===id), pl);
     DB.set('gymPlans', plans);
     UI.closeModal('plan-modal');
     UI.toast('Plan saved');
     Plans.render();
  },
  edit: (id) => {
     const p = DB.get('gymPlans').find(x=>x.id===id);
     if(!p) return;
     Plans.openPlanModal();
     document.getElementById('plan-modal-title').innerText = 'Edit Plan';
     document.getElementById('plan-id').value = p.id;
     document.getElementById('pl-name').value = p.name;
     document.getElementById('pl-dur').value = p.duration;
     document.getElementById('pl-price').value = p.price;
     document.getElementById('pl-color').value = p.color;
     document.getElementById('pl-feat').value = p.features.join(', ');
  },
  delete: (id) => {
     const mems = DB.get('gymMembers');
     const p = DB.get('gymPlans').find(x=>x.id===id);
     if(mems.some(m => m.membershipType === p.name && m.status === 'Active')) {
        UI.toast('Cannot delete plan with active members', 'error'); return;
     }
     UI.confirm('Delete plan?', () => {
        const plans = DB.get('gymPlans').filter(x=>x.id!==id);
        DB.set('gymPlans', plans);
        UI.toast('Plan deleted');
        Plans.render();
     });
  }
};

const Attendance = {
  setDateToToday: () => {
     document.getElementById('att-date-picker').value = new Date().toISOString().split('T')[0];
     Attendance.renderMarkGrid();
  },
  renderMarkGrid: () => {
     const d = document.getElementById('att-date-picker').value;
     if(!d) return;
     const mems = DB.get('gymMembers').filter(m=>m.status==='Active');
     const atts = DB.get('gymAttendance').filter(a=>a.date===d);
     const s = document.getElementById('att-search').value.toLowerCase();
     
     const c = document.getElementById('att-mark-grid');
     c.innerHTML = '';
     mems.forEach(m => {
        if(s && !m.name.toLowerCase().includes(s)) return;
        const mark = atts.find(a=>a.memberId === m.id);
        const bg = mark ? 'var(--success)' : 'var(--bg-card)';
        const opacity = mark ? '0.2' : '1';
        let avatar = m.photo ? `<img src="${m.photo}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">` : `<div class="avatar" style="width:40px;height:40px;">${m.name[0]}</div>`;
        
        c.innerHTML += `<div class="card p-4" style="background: ${mark?'rgba(34,197,94,0.1)':'var(--bg-card)'}; border-color: ${mark?'var(--success)':'var(--border)'}; display:flex; align-items:center; gap:16px;">
          ${avatar}
          <div style="flex:1">
            <div style="font-weight:600">${m.name}</div>
            <div style="font-size:12px; color:var(--text-muted)">${m.membershipType}</div>
          </div>
          <button class="btn ${mark?'btn-secondary':'btn-primary'} btn-sm" onclick="Attendance.toggleMark('${m.id}')">${mark?'<i class="fa-solid fa-check"></i>':'Mark'}</button>
        </div>`;
     });
  },
  toggleMark: (mid) => {
     const d = document.getElementById('att-date-picker').value;
     let atts = DB.get('gymAttendance');
     const idx = atts.findIndex(a => a.memberId === mid && a.date === d);
     if(idx !== -1) {
       atts.splice(idx, 1);
     } else {
       const m = DB.get('gymMembers').find(x=>x.id===mid);
       atts.push({ id: DB.generateId(), memberId: mid, memberName: m.name, date: d, checkIn: new Date().toTimeString().substring(0,5), checkOut: null, note: '' });
     }
     DB.set('gymAttendance', atts);
     Attendance.renderMarkGrid();
  },
  markAll: () => {
     const d = document.getElementById('att-date-picker').value;
     let atts = DB.get('gymAttendance');
     DB.get('gymMembers').filter(m=>m.status==='Active').forEach(m => {
        if(!atts.some(a=>a.memberId===m.id && a.date===d)) {
           atts.push({ id: DB.generateId(), memberId: m.id, memberName: m.name, date: d, checkIn: new Date().toTimeString().substring(0,5) });
        }
     });
     DB.set('gymAttendance', atts);
     Attendance.renderMarkGrid();
  },
  clearAll: () => {
     const d = document.getElementById('att-date-picker').value;
     let atts = DB.get('gymAttendance').filter(a=>a.date!==d);
     DB.set('gymAttendance', atts);
     Attendance.renderMarkGrid();
  },
  loadHistory: () => {
     const from = document.getElementById('hist-date-from').value;
     const to = document.getElementById('hist-date-to').value;
     let atts = DB.get('gymAttendance');
     if(from) atts = atts.filter(a => a.date >= from);
     if(to) atts = atts.filter(a => a.date <= to);
     
     const tb = document.querySelector('#att-history-table tbody');
     tb.innerHTML = '';
     atts.sort((a,b)=>new Date(b.date)-new Date(a.date)).forEach(a => {
        tb.innerHTML += `<tr>
          <td data-label="Member">${a.memberName}</td>
          <td data-label="Date">${a.date}</td>
          <td data-label="Check-In">${a.checkIn}</td>
          <td data-label="Check-Out">${a.checkOut || '-'}</td>
          <td data-label="Actions"><button class="btn btn-danger btn-sm" onclick="Attendance.deleteLog('${a.id}')"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
     });
  },
  deleteLog: (id) => {
     UI.confirm('Delete this attendance log?', () => {
        let atts = DB.get('gymAttendance');
        atts = atts.filter(a => a.id !== id);
        DB.set('gymAttendance', atts);
        UI.toast('Log deleted');
        Attendance.loadHistory();
     });
  },
  populateReportSelect: () => {
     const ms = DB.get('gymMembers');
     const sel = document.getElementById('report-member-select');
     sel.innerHTML = '<option value="">Select Member...</option>' + ms.map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
  },
  loadReport: () => {
     const mid = document.getElementById('report-member-select').value;
     if(!mid) { document.getElementById('att-report-content').style.display='none'; return; }
     document.getElementById('att-report-content').style.display='block';
     
     const atts = DB.get('gymAttendance').filter(a=>a.memberId===mid);
     document.getElementById('rep-total').innerText = atts.length;
     document.getElementById('rep-rate').innerText = (atts.length > 0 ? 'Active' : 'No Data');
     
     const list = document.getElementById('rep-list');
     list.innerHTML = atts.slice(-10).reverse().map(a=>`<div style="padding:8px; border-bottom:1px solid var(--border);">${a.date} at ${a.checkIn}</div>`).join('');
  },
  exportCSV: () => {
     const atts = DB.get('gymAttendance');
     let csv = 'Date,Member,CheckIn\n';
     atts.forEach(a => csv += `${a.date},"${a.memberName}",${a.checkIn}\n`);
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url; a.download = 'attendance.csv';
     a.click();
  }
};

const Payments = {
  render: () => {
     const pays = DB.get('gymPayments');
     let tr = 0, mr = 0, pt = 0, po = 0;
     const cm = new Date().getMonth(), cy = new Date().getFullYear();
     pays.forEach(p => {
        if(p.status==='Paid') {
           tr += p.amount;
           const pd = new Date(p.paymentDate);
           if(pd.getMonth()===cm && pd.getFullYear()===cy) mr += p.amount;
        } else if(p.status==='Pending') pt += p.amount;
        else if(p.status==='Overdue') po++;
     });
     document.getElementById('pay-total-rev').innerText = 'Ksh '+tr.toFixed(2);
     document.getElementById('pay-month-rev').innerText = 'Ksh '+mr.toFixed(2);
     document.getElementById('pay-pending').innerText = 'Ksh '+pt.toFixed(2);
     document.getElementById('pay-overdue').innerText = po;
     
     const s = document.getElementById('pay-search').value.toLowerCase();
     const st = document.getElementById('pay-filter-status').value;
     
     let filtered = pays.filter(p => {
        let m = true;
        if(s && !(p.memberName.toLowerCase().includes(s) || (p.invoiceNo||'').toLowerCase().includes(s))) m = false;
        if(st !== 'All' && p.status !== st) m = false;
        return m;
     });
     
     const tbody = document.querySelector('#payments-table tbody');
     tbody.innerHTML = '';
     filtered.sort((a,b)=>new Date(b.paymentDate)-new Date(a.paymentDate)).forEach(p => {
        let sc = p.status==='Paid'?'status-active':(p.status==='Pending'?'status-pending':'status-expired');
        tbody.innerHTML += `<tr>
          <td data-label="Invoice">${p.invoiceNo||'-'}</td>
          <td data-label="Member">${p.memberName}</td>
          <td data-label="Plan">${p.planName}</td>
          <td data-label="Amount">Ksh ${p.amount.toFixed(2)}</td>
          <td data-label="Date">${p.paymentDate}</td>
          <td data-label="Status"><span class="status-badge ${sc}">${p.status}</span></td>
          <td data-label="Actions">
             <button class="btn btn-secondary btn-sm" onclick="Payments.print('${p.id}')">View</button>
             <button class="btn btn-danger btn-sm" onclick="Payments.delete('${p.id}')"><i class="fa-solid fa-trash"></i></button>
             ${p.status !== 'Paid' ? `<button class="btn btn-sm wa-btn" onclick="WhatsApp.send('${DB.get('gymMembers').find(x=>x.id===p.memberId)?.phone||''}', 'Hello ${p.memberName}, your invoice ${p.invoiceNo||''} for Ksh ${p.amount} is ${p.status}. Kindly arrange for payment.')"><i class="fa-brands fa-whatsapp"></i></button>` : ''}
          </td>
        </tr>`;
     });
  },
  openAddModal: () => {
     document.getElementById('payment-form').reset();
     document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
     const sel = document.getElementById('pay-mem');
     sel.innerHTML = '<option value="">Select...</option>' + DB.get('gymMembers').map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
     UI.openModal('payment-modal');
  },
  autoFill: () => {
     const mid = document.getElementById('pay-mem').value;
     if(!mid) return;
     const m = DB.get('gymMembers').find(x=>x.id===mid);
     const p = DB.get('gymPlans').find(x=>x.name===m.membershipType);
     if(p) document.getElementById('pay-amt').value = p.price;
  },
  save: () => {
     if(!document.getElementById('payment-form').checkValidity()) { UI.toast('Fill form correctly','error'); return; }
     const mid = document.getElementById('pay-mem').value;
     const m = DB.get('gymMembers').find(x=>x.id===mid);
     const pays = DB.get('gymPayments');
     pays.push({
        id: DB.generateId(),
        memberId: m.id,
        memberName: m.name,
        planName: m.membershipType,
        amount: parseFloat(document.getElementById('pay-amt').value),
        paymentDate: document.getElementById('pay-date').value,
        method: document.getElementById('pay-method').value,
        status: document.getElementById('pay-stat').value,
        invoiceNo: DB.generateInvoice()
     });
     
     // Update member end date logic if Paid
     if(document.getElementById('pay-stat').value === 'Paid') {
        const p = DB.get('gymPlans').find(x=>x.name===m.membershipType);
        if(p) {
           let e = new Date(m.endDate);
           if(e < new Date()) e = new Date();
           e.setDate(e.getDate() + p.duration);
           m.endDate = e.toISOString().split('T')[0];
           m.status = 'Active';
           let ms = DB.get('gymMembers');
           Object.assign(ms.find(x=>x.id===m.id), m);
           DB.set('gymMembers', ms);
        }
     }
     
     DB.set('gymPayments', pays);
     UI.closeModal('payment-modal');
     UI.toast('Payment recorded');
     Payments.render();
     Dashboard.render();
     Notifications.runChecks();
  },
  delete: (id) => {
     UI.confirm('Are you sure you want to delete this payment log?', () => {
        let pays = DB.get('gymPayments');
        pays = pays.filter(p => p.id !== id);
        DB.set('gymPayments', pays);
        UI.toast('Payment log deleted');
        Payments.render();
     });
  },
  print: (id) => {
     const p = DB.get('gymPayments').find(x=>x.id===id);
     const gs = DB.get('gymSettings');
     document.getElementById('inv-gym-name').innerText = gs.gymName || 'FitFlex Gym';
     document.getElementById('inv-gym-tag').innerText = gs.tagline || 'Your fitness journey starts here';
     document.getElementById('inv-no').innerText = '#' + (p.invoiceNo || 'N/A');
     document.getElementById('inv-mem').innerText = p.memberName;
     document.getElementById('inv-date').innerText = p.paymentDate;
     document.getElementById('inv-status').innerText = p.status;
     document.getElementById('inv-method').innerText = p.method;
     document.getElementById('inv-desc').innerText = `Membership Plan: ${p.planName}`;
     document.getElementById('inv-amt').innerText = 'Ksh ' + p.amount.toFixed(2);
     document.getElementById('inv-total').innerText = 'Ksh ' + p.amount.toFixed(2);
     window.print();
  }
};

const Notifications = {
  runChecks: () => {
     const mems = DB.get('gymMembers');
     const pays = DB.get('gymPayments');
     const notifs = [];
     const d = DB.get('gymDismissedNotifs') || [];
     const today = new Date();
     
     mems.forEach(m => {
        const ed = new Date(m.endDate);
        const diff = Math.ceil((ed - today) / (1000 * 3600 * 24));
        if(diff <= 7 && diff >= 0 && m.status==='Active') {
           const id = 'exp_warn_'+m.id+'_'+m.endDate;
           if(!d.includes(id)) {
              notifs.push({ id, type: 'warning', title: 'Membership Expiring', msg: `${m.name}'s plan expires in ${diff} days.`, icon: 'user-clock', memberId: m.id, phone: m.phone, name: m.name });
           }
        }
        if(diff < 0 && m.status==='Active') {
           // Auto expiry
           m.status = 'Expired';
           DB.set('gymMembers', mems);
           const id = 'expired_'+m.id+'_'+m.endDate;
           if(!d.includes(id)) {
             notifs.push({ id, type: 'error', title: 'Membership Expired', msg: `${m.name}'s plan has expired.`, icon: 'user-xmark', memberId: m.id, phone: m.phone, name: m.name });
           }
        }
     });
     
     pays.forEach(p => {
        if(p.status === 'Pending') {
           const pd = new Date(p.paymentDate);
           const diff = Math.ceil((today - pd) / (1000 * 3600 * 24));
           if(diff > 3) {
              const id = 'pay_over_'+p.id;
              if(!d.includes(id)) {
                 notifs.push({ id, type: 'error', title: 'Overdue Payment', msg: `Invoice ${p.invoiceNo} for ${p.memberName} is overdue.`, icon: 'file-invoice-dollar', memberId: p.memberId, phone: DB.get('gymMembers').find(x=>x.id===p.memberId)?.phone, name: p.memberName });
                 p.status = 'Overdue';
              }
           }
        }
     });
     DB.set('gymPayments', pays);
     
     DB.set('gymNotifs', notifs);
     Notifications.updateBadge();
  },
  updateBadge: () => {
    const n = DB.get('gymNotifs').length;
    const b1 = document.getElementById('nav-badge-notifications');
    const b2 = document.getElementById('header-badge-notifications');
    if(n > 0) { b1.style.display='block'; b1.innerText=n; b2.style.display='block'; b2.innerText=n; }
    else { b1.style.display='none'; b2.style.display='none'; }
  },
  render: () => {
     const ns = DB.get('gymNotifs');
     const c = document.getElementById('notifications-container');
     c.innerHTML = '';
     if(ns.length===0) { c.innerHTML = '<p class="text-secondary">No new notifications.</p>'; return; }
     ns.forEach(n => {
        let cBorder = n.type==='error'?'var(--danger)':'var(--warning)';
        c.innerHTML += `<div class="card mb-4" style="border-left: 4px solid ${cBorder}; display:flex; align-items:center; gap:16px;">
          <div style="font-size:24px; color:${cBorder}"><i class="fa-solid fa-${n.icon}"></i></div>
          <div style="flex:1;">
             <h4 style="margin:0;">${n.title}</h4>
             <p style="margin:0; color:var(--text-secondary); font-size:13px;">${n.msg}</p>
          </div>
          ${n.phone ? `<button class="btn btn-sm wa-btn" onclick="WhatsApp.send('${n.phone}', 'Hello ${n.name}, ${n.msg}')" style="border-radius:10px;"><i class="fa-brands fa-whatsapp"></i></button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="Notifications.dismiss('${n.id}')">Dismiss</button>
        </div>`;
     });
  },
  dismiss: (id) => {
     let ns = DB.get('gymNotifs');
     ns = ns.filter(n => n.id !== id);
     DB.set('gymNotifs', ns);
     let d = DB.get('gymDismissedNotifs');
     d.push(id); DB.set('gymDismissedNotifs', d);
     Notifications.updateBadge();
     Notifications.render();
  },
  markAllRead: () => {
     let ns = DB.get('gymNotifs');
     let d = DB.get('gymDismissedNotifs');
     ns.forEach(n => d.push(n.id));
     DB.set('gymDismissedNotifs', d);
     DB.set('gymNotifs', []);
     Notifications.updateBadge();
     Notifications.render();
  }
};

const Settings = {
  load: () => {
     const s = DB.get('gymSettings');
     document.getElementById('set-gym-name').value = s.gymName || 'FitFlex Gym';
     document.getElementById('set-gym-tag').value = s.tagline || 'Your fitness journey starts here';
     document.getElementById('set-gym-curr').value = s.currency || 'Ksh ';
     
     document.getElementById('sidebar-gym-name').innerText = s.gymName || 'FitFlex Gym';
     document.title = (s.gymName || 'Gym System') + ' - Management';
     const authHeader = document.getElementById('auth-title');
     if(authHeader) authHeader.innerText = s.gymName || 'Gym Admin Login';
     
     const session = JSON.parse(localStorage.getItem('gymSession') || '{}');
     const currentName = session.name || 'Admin';
     document.getElementById('header-admin-name').innerText = currentName;
     document.getElementById('header-avatar').innerText = currentName[0].toUpperCase();
     
     Settings.renderAdmins();
     
     // Storage calc
     let total = 0;
     for(let i in localStorage) { if(localStorage.hasOwnProperty(i)) { total += ((localStorage[i].length + i.length) * 2); } }
     document.getElementById('storage-usage').innerText = (total / 1024).toFixed(2);
  },
  saveGym: () => {
     let s = DB.get('gymSettings');
     s.gymName = document.getElementById('set-gym-name').value;
     s.tagline = document.getElementById('set-gym-tag').value;
     s.currency = document.getElementById('set-gym-curr').value;
     DB.set('gymSettings', s);
     UI.toast('Gym profile updated');
     Settings.load();
  },
  renderAdmins: () => {
     let s = DB.get('gymSettings');
     let admins = s.admins || [{name:'Super Admin', user:'admin', pass:'gym@2024'}];
     const tb = document.querySelector('#admins-table tbody');
     if(!tb) return;
     tb.innerHTML = '';
     admins.forEach((a, idx) => {
        tb.innerHTML += `<tr>
           <td>${a.name}</td><td>${a.user}</td>
           <td>
              ${admins.length > 1 ? `<button class="btn btn-danger btn-sm" onclick="Settings.deleteAdmin(${idx})"><i class="fa-solid fa-trash"></i></button>` : '<span class="text-secondary" style="font-size:12px">Primary</span>'}
           </td>
        </tr>`;
     });
     if(admins.length >= 4) document.getElementById('btn-add-admin').style.display = 'none';
     else document.getElementById('btn-add-admin').style.display = 'inline-block';
  },
  openAdminModal: () => {
     document.getElementById('admin-form').reset();
     UI.openModal('add-admin-modal');
  },
  saveAdmin: () => {
     if(!document.getElementById('admin-form').checkValidity()) { UI.toast('Fill details', 'error'); return;}
     let s = DB.get('gymSettings');
     let admins = s.admins || [{name:'Super Admin', user:'admin', pass:'gym@2024'}];
     if(admins.length >= 4) { UI.toast('Max 4 admins allowed', 'error'); return; }
     
     admins.push({
        name: document.getElementById('adm-name').value,
        user: document.getElementById('adm-user').value,
        pass: document.getElementById('adm-pass').value
     });
     s.admins = admins;
     DB.set('gymSettings', s);
     UI.closeModal('add-admin-modal');
     UI.toast('Admin added successfully');
     Settings.renderAdmins();
  },
  deleteAdmin: (idx) => {
     let s = DB.get('gymSettings');
     if(!s.admins || s.admins.length <= 1) return;
     UI.confirm('Are you sure you want to delete this admin?', () => {
        s.admins.splice(idx, 1);
        DB.set('gymSettings', s);
        UI.toast('Admin removed');
        Settings.renderAdmins();
     });
  },
  exportData: () => {
     const data = {
        settings: DB.get('gymSettings'),
        plans: DB.get('gymPlans'),
        members: DB.get('gymMembers'),
        payments: DB.get('gymPayments'),
        attendance: DB.get('gymAttendance')
     };
     const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url; a.download = 'gym_backup.json'; a.click();
  },
  clearData: () => {
     UI.confirm('This will delete all data and cannot be undone. Proceed?', () => {
        localStorage.clear();
        location.reload();
     });
  }
};

const App = {
  init: () => {
    Seed.run();
    Auth.init();
    
    // Theme logic removed to enforce global light mode

    // Sidebar toggle
    document.getElementById('menu-toggle').onclick = () => {
       document.getElementById('sidebar').classList.toggle('mobile-open');
    };
    
    // Routing manually using buttons
    document.querySelectorAll('.sidebar .nav-item').forEach(el => {
       el.onclick = (e) => {
          document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
          let target = e.currentTarget;
          target.classList.add('active');
          const tId = target.getAttribute('data-target');
          if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('mobile-open');
          App.navigate(tId);
       };
    });

    // Setup Tabs
    document.querySelectorAll('.tab').forEach(el => {
       el.onclick = (e) => {
          const p = e.target.parentElement;
          p.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
          e.target.classList.add('active');
          const tc = e.target.getAttribute('data-tab');
          p.parentElement.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
          document.getElementById(tc).classList.add('active');
       }
    });

    // Event Listeners for Filters
    ['member-search', 'member-filter-status', 'member-filter-plan'].forEach(id => {
       document.getElementById(id).addEventListener('input', Members.render);
    });
    ['pay-search', 'pay-filter-status'].forEach(id => {
       document.getElementById(id).addEventListener('input', Payments.render);
    });
    document.getElementById('att-date-picker').addEventListener('change', Attendance.renderMarkGrid);
    document.getElementById('att-search').addEventListener('input', Attendance.renderMarkGrid);
    
    // Pagination
    document.getElementById('mem-prev').onclick = () => { if(Members.page>1) { Members.page--; Members.render(); } };
    document.getElementById('mem-next').onclick = () => { const lim = Math.ceil(DB.get('gymMembers').length/Members.limit); if(Members.page<Math.max(1,lim)) { Members.page++; Members.render(); } };

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
       if(e.ctrlKey && e.key === 'k') {
          e.preventDefault();
          App.navigate('members');
          document.getElementById('member-search').focus();
       }
    });
  },
  loadData: () => {
    Settings.load();
    Notifications.runChecks();
    Attendance.setDateToToday();
    Attendance.populateReportSelect();
    App.navigate('dashboard');
  },
  navigate: (viewName) => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + viewName).classList.add('active');
    
    const pageTitles = {
       'dashboard': 'Dashboard', 'members': 'Members', 'plans': 'Membership Plans',
       'attendance': 'Attendance', 'payments': 'Payments', 'notifications': 'Notifications', 'settings': 'Settings',
       'shop': 'Store POS & Inventory', 'classes': 'Class Schedule'
    };
    document.getElementById('page-title').innerText = pageTitles[viewName];

    if(viewName === 'dashboard') Dashboard.render();
    if(viewName === 'members') { Members.page = 1; Members.render(); }
    if(viewName === 'plans') Plans.render();
    if(viewName === 'payments') Payments.render();
    if(viewName === 'notifications') Notifications.render();
    if(viewName === 'shop') Shop.render();
    if(viewName === 'classes') Classes.render();
  }
};

window.onload = App.init;
