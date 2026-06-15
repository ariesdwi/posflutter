# Frontend Integration Guide - VM Inventory API

## 🎯 Overview

Dokumentasi lengkap untuk integrasi Frontend dengan VM Inventory Backend API.

---

## 🔐 Authentication Flow

### Step 1: Register Admin (First Time Only)

**Endpoint:** `POST /api/auth/register`

**Request:**
```javascript
{
  "username": "admin",
  "password": "Admin123456"
}
```

**Response (Success - 201):**
```javascript
{
  "id": 1,
  "username": "admin",
  "role": "ADMIN",
  "createdAt": "2026-06-09T10:00:00.000Z"
}
```

**Response (Error - 409):**
```javascript
{
  "statusCode": 409,
  "message": "Username already taken",
  "error": "Conflict"
}
```

⚠️ **Important:** Jika error 409, artinya user sudah ada. Langsung login saja.

---

### Step 2: Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```javascript
{
  "username": "admin",
  "password": "Admin123456"
}
```

**Response (Success - 200):**
```javascript
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

**Response (Error - 401):**
```javascript
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Possible Causes:**
1. Username salah (case-sensitive!)
2. Password salah (harus minimal 8 karakter)
3. User belum dibuat

---

### Step 3: Use Token in API Requests

Setiap request ke protected endpoint harus menyertakan JWT token di header:

```javascript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📱 React/Next.js Implementation

### 1. Setup API Service

Create `services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Auth Service

Create `services/authService.js`:

```javascript
import api from './api';

export const authService = {
  // Register new user (first user = ADMIN)
  async register(username, password) {
    try {
      const response = await api.post('/api/auth/register', {
        username,
        password,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  // Login
  async login(username, password) {
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });
      
      const { access_token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, data: { access_token, user } };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed'
      };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  // Get token
  getToken() {
    return localStorage.getItem('access_token');
  },
};
```

### 3. Login Component (React)

Create `components/Login.jsx`:

```javascript
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authService.login(
      formData.username, 
      formData.password
    );

    setLoading(false);

    if (result.success) {
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="admin"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            placeholder="Min 8 characters"
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

### 4. Summary API Service

Create `services/summaryService.js`:

```javascript
import api from './api';

export const summaryService = {
  // Get complete management report
  async getManagementReport() {
    try {
      const response = await api.get('/api/summary/management');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch report' 
      };
    }
  },

  // Get obsolete summary by OS type
  async getObsoleteSummary(osType) {
    try {
      const response = await api.get('/api/summary/obsolete', {
        params: { osType }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch summary' 
      };
    }
  },

  // Get app-department mapping
  async getAppMapping(osType, category = 'Production') {
    try {
      const response = await api.get('/api/summary/app-mapping', {
        params: { osType, category }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch mapping' 
      };
    }
  },

  // Get department summary
  async getDepartmentSummary(osType = null) {
    try {
      const params = osType ? { osType } : {};
      const response = await api.get('/api/summary/by-department', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch summary' 
      };
    }
  },
};
```

### 5. Dashboard Component Example

Create `components/Dashboard.jsx`:

```javascript
import { useEffect, useState } from 'react';
import { summaryService } from '../services/summaryService';
import { authService } from '../services/authService';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Fetch management report
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await summaryService.getManagementReport();
    
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <header>
        <h1>VM Inventory Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {data && (
        <>
          <section className="overview">
            <h2>Overview</h2>
            <div className="cards">
              <div className="card">
                <h3>Obsolete Ubuntu</h3>
                <p className="value">{data.overview.totalObsoleteUbuntu}</p>
              </div>
              <div className="card">
                <h3>Obsolete CentOS</h3>
                <p className="value">{data.overview.totalObsoleteCentOS}</p>
              </div>
              <div className="card">
                <h3>Total Production VMs</h3>
                <p className="value">{data.overview.totalProductionVMs}</p>
              </div>
              <div className="card critical">
                <h3>Critical Obsolete</h3>
                <p className="value">{data.overview.criticalObsolete}</p>
              </div>
            </div>
          </section>

          <section className="details">
            <h2>Ubuntu Obsolete Details</h2>
            <p>Total: {data.ubuntuObsolete.totalObsolete} / {data.ubuntuObsolete.totalProduction} ({data.ubuntuObsolete.obsoletePercentage}%)</p>
            
            <h3>By Kritikalitas</h3>
            <ul>
              {data.ubuntuObsolete.byKritikalitas.map((item) => (
                <li key={item.kritikalitas}>
                  {item.kritikalitas}: {item.count}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
```

---

## 🌐 Vanilla JavaScript Implementation

### Complete Example (HTML + JS)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VM Inventory Login</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; }
    input { width: 100%; padding: 8px; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
    button:hover { background: #0056b3; }
    .error { color: red; margin-top: 10px; }
    .success { color: green; margin-top: 10px; }
  </style>
</head>
<body>
  <h2>VM Inventory Login</h2>
  
  <form id="loginForm">
    <div class="form-group">
      <label>Username</label>
      <input type="text" id="username" required placeholder="admin" />
    </div>
    
    <div class="form-group">
      <label>Password</label>
      <input type="password" id="password" required minlength="8" placeholder="Min 8 characters" />
    </div>
    
    <button type="submit">Login</button>
    
    <div id="message"></div>
  </form>

  <script>
    const API_URL = 'http://localhost:3000';
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const messageDiv = document.getElementById('message');
      
      messageDiv.textContent = 'Logging in...';
      messageDiv.className = '';
      
      try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Success
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          messageDiv.textContent = 'Login successful! Redirecting...';
          messageDiv.className = 'success';
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 1000);
        } else {
          // Error
          messageDiv.textContent = data.message || 'Login failed';
          messageDiv.className = 'error';
        }
      } catch (error) {
        messageDiv.textContent = 'Network error: ' + error.message;
        messageDiv.className = 'error';
      }
    });
  </script>
</body>
</html>
```

---

## 📱 Vue.js Implementation

### 1. API Service (`services/api.js`)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 2. Auth Store (Vuex)

```javascript
// store/auth.js
import api from '../services/api';

export default {
  namespaced: true,
  
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('access_token') || null,
  },
  
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    SET_TOKEN(state, token) {
      state.token = token;
      localStorage.setItem('access_token', token);
    },
    LOGOUT(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    },
  },
  
  actions: {
    async login({ commit }, { username, password }) {
      try {
        const response = await api.post('/api/auth/login', {
          username,
          password,
        });
        
        const { access_token, user } = response.data;
        
        commit('SET_TOKEN', access_token);
        commit('SET_USER', user);
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error.response?.data?.message || 'Login failed' 
        };
      }
    },
    
    logout({ commit }) {
      commit('LOGOUT');
    },
  },
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
  },
};
```

### 3. Login Component (Vue)

```vue
<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Username</label>
        <input 
          v-model="form.username" 
          type="text" 
          required 
          placeholder="admin"
        />
      </div>
      
      <div class="form-group">
        <label>Password</label>
        <input 
          v-model="form.password" 
          type="password" 
          required 
          minlength="8"
          placeholder="Min 8 characters"
        />
      </div>
      
      <div v-if="error" class="error">{{ error }}</div>
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        password: '',
      },
      error: '',
      loading: false,
    };
  },
  
  methods: {
    async handleLogin() {
      this.error = '';
      this.loading = true;
      
      const result = await this.$store.dispatch('auth/login', this.form);
      
      this.loading = false;
      
      if (result.success) {
        this.$router.push('/dashboard');
      } else {
        this.error = result.error;
      }
    },
  },
};
</script>
```

---

## 🔧 Angular Implementation

### 1. Auth Service

```typescript
// services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<any>(
    JSON.parse(localStorage.getItem('user') || 'null')
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/api/auth/login`, {
        username,
        password,
      })
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }
}
```

### 2. HTTP Interceptor

```typescript
// interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.authService.getToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(req);
  }
}
```

### 3. Login Component

```typescript
// components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed';
      }
    });
  }
}
```

```html
<!-- login.component.html -->
<div class="login-container">
  <h2>Login</h2>
  <form (ngSubmit)="onSubmit()">
    <div class="form-group">
      <label>Username</label>
      <input 
        [(ngModel)]="username" 
        name="username"
        type="text" 
        required 
        placeholder="admin"
      />
    </div>
    
    <div class="form-group">
      <label>Password</label>
      <input 
        [(ngModel)]="password" 
        name="password"
        type="password" 
        required 
        minlength="8"
        placeholder="Min 8 characters"
      />
    </div>
    
    <div *ngIf="error" class="error">{{ error }}</div>
    
    <button type="submit" [disabled]="loading">
      {{ loading ? 'Logging in...' : 'Login' }}
    </button>
  </form>
</div>
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid credentials" Error

**Possible Causes:**
1. **Password terlalu pendek** - Minimal 8 karakter
2. **Username salah** - Case-sensitive! Harus persis "admin"
3. **User belum dibuat** - Harus register dulu

**Solution:**
```bash
# Check if admin user exists
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'

# If 401, create admin user first:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'
```

---

### Issue 2: CORS Error

**Error:** `Access to fetch has been blocked by CORS policy`

**Solution:** Enable CORS di backend (sudah enabled by default di NestJS)

Jika masih error, check `main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // add your frontend URL
  credentials: true,
});
```

---

### Issue 3: 401 Unauthorized on Protected Endpoints

**Possible Causes:**
1. Token expired (default 1 day)
2. Token tidak dikirim di header
3. Format header salah

**Solution:**
```javascript
// Correct format
headers: {
  'Authorization': 'Bearer ' + token  // Notice the space after "Bearer"
}

// Wrong format
headers: {
  'Authorization': token  // ❌ Missing "Bearer"
  'Authorization': 'bearer ' + token  // ❌ lowercase "bearer"
}
```

---

### Issue 4: Network Error / Cannot Connect

**Possible Causes:**
1. Backend server tidak running
2. Wrong API URL
3. Port different

**Solution:**
```bash
# 1. Check if backend is running
curl http://localhost:3000/api/auth/login

# 2. Check correct port in .env or main.ts
# Default is 3000

# 3. Update frontend API URL
# React: .env → REACT_APP_API_URL=http://localhost:3000
# Vue: .env → VUE_APP_API_URL=http://localhost:3000
# Next.js: .env.local → NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## ✅ Testing Checklist

### Backend Setup
- [ ] Backend server running (`npm run start:dev`)
- [ ] Database connected
- [ ] Admin user created

### Test with curl:
```bash
# 1. Create admin (if not exists)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'

# 3. Test protected endpoint
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Testing
- [ ] API URL configured correctly
- [ ] CORS enabled
- [ ] Login form submits correctly
- [ ] Token saved to localStorage
- [ ] Token sent in header for protected routes
- [ ] Redirect to dashboard after login
- [ ] Logout clears token

---

## 📊 Example API Responses

### Successful Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE2ODY5MjM0NTYsImV4cCI6MTY4NzAwOTg1Nn0.Xx1234567890",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### Error Responses

**401 Unauthorized (Wrong Password):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**409 Conflict (Username Already Exists):**
```json
{
  "statusCode": 409,
  "message": "Username already taken",
  "error": "Conflict"
}
```

**400 Bad Request (Validation Error):**
```json
{
  "statusCode": 400,
  "message": [
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## 🔒 Security Best Practices

### 1. Never Store Sensitive Data in Code
```javascript
// ❌ BAD
const API_URL = 'http://production-server.com';
const DEFAULT_PASSWORD = 'Admin123456';

// ✅ GOOD
const API_URL = process.env.REACT_APP_API_URL;
// Let users enter password each time
```

### 2. Use HTTPS in Production
```javascript
// ❌ BAD (Production)
const API_URL = 'http://api.example.com';

// ✅ GOOD (Production)
const API_URL = 'https://api.example.com';
```

### 3. Token Expiration Handling
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 4. Logout on Browser Close (Optional)
```javascript
// Use sessionStorage instead of localStorage
// Token will be cleared when browser closes
sessionStorage.setItem('access_token', token);
```

---

## 📞 Support

### Quick Debug Commands

```bash
# Check backend is running
curl http://localhost:3000/api/auth/login

# Check if admin exists
psql -U postgres -d your_database -c "SELECT username, role FROM users;"

# Create admin via backend
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'
```

### Contact
- **Documentation:** [README.md](README.md)
- **Setup Guide:** [SETUP_ADMIN.md](SETUP_ADMIN.md)
- **API Reference:** [SUMMARY_API_QUICKREF.md](SUMMARY_API_QUICKREF.md)

---

## 🎉 Quick Start Summary

1. **Start Backend:**
   ```bash
   npm run start:dev
   ```

2. **Create Admin (First Time):**
   ```bash
   ./scripts/create-admin.sh
   ```

3. **Test Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"Admin123456"}'
   ```

4. **In Your Frontend:**
   - Install axios or use fetch
   - Implement login form
   - Save token to localStorage
   - Add token to request headers
   - Done! 🚀

---

**Status:** ✅ Ready for Integration

**Default Credentials:**
- Username: `admin`
- Password: `Admin123456`

⚠️ **Change password after first login!**
