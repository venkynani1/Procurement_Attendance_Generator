<template>
  <div>
    <header class="site-header">
      <nav class="nav">
        <div class="nav-inner">
          <div class="brand-wrap">
            <RouterLink to="/" class="brand">
              TCX<span class="brand-accent">.</span>
            </RouterLink>
            <span class="brand-tag">Attendance & Training</span>
          </div>

          <input id="nav-toggle" type="checkbox" class="nav-toggle" />
          <label for="nav-toggle" class="nav-toggle-label" aria-hidden="true">
            <span class="hamburger"></span>
          </label>

          <div class="nav-links">
            <RouterLink to="/" class="nav-link">Attendance Generator</RouterLink>
            <RouterLink v-if="isAuthenticated" to="/prepost" class="nav-link">Effectiveness Report</RouterLink>
            <RouterLink v-if="isAuthenticated" to="/trainings" class="nav-link">Training Dashboard</RouterLink>

            <div v-if="!isAuthenticated" class="auth-wrap">
              <button @click="goLogin" class="btn btn-primary">Login</button>
            </div>

            <div v-else class="auth-wrap auth-logged">
              <span class="greet">Hello, {{ userName }}</span>
              <button @click="handleLogout" class="btn btn-ghost">Logout</button>
            </div>
          </div>
        </div>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

<script>
import { RouterView, RouterLink } from "vue-router";
import { getToken, getUser, logout } from "./services/auth"; // adjust path if needed

export default {
  components: {
    RouterView,
    RouterLink,
  },
  data() {
    return {
      token: getToken(), // initial token snapshot
      user: getUser(),   // initial user snapshot (expected { name, email, role, ... } or null)
    };
  },
  computed: {
    isAuthenticated() {
      return !!this.token;
    },
    userName() {
      // choose the best available display name
      if (!this.user) return 'User'
      return this.user.name || this.user.fullName || this.user.email || 'User'
    }
  },
  methods: {
    goLogin() {
      // preserve redirect if desired
      const current = this.$route.fullPath || '/'
  if (this.$route.name === 'login') {
    this.$router.replace({ name: 'login' })
  } else {
    this.$router.push({ name: 'login', query: { redirect: current } })
  }
    },
    handleLogout() {
      logout(); // should clear token and user in auth service (and emit auth-change)
      // update local snapshots so UI updates immediately
      this.token = null;
      this.user = null;
      // redirect to home after logout
      this.$router.push({ name: "home" });
    },
    onStorage(e) {
      // update token and user when storage changes in other tabs
      this.token = getToken();
      this.user = getUser();
    },
    onAuthChange() {
      // custom event to update token/user in same tab
      this.token = getToken();
      this.user = getUser();
    },
  },
  mounted() {
    // listen for storage changes from other tabs
    window.addEventListener("storage", this.onStorage);
    // custom event: other parts of the app (eg. login component) can dispatch `auth-change`
    window.addEventListener("auth-change", this.onAuthChange);
  },
  beforeUnmount() {
    window.removeEventListener("storage", this.onStorage);
    window.removeEventListener("auth-change", this.onAuthChange);
  },
};
</script>

<style scoped>
/* Header container: soft gradient + glass effect */
.site-header {
  background: linear-gradient(135deg, rgba(63,94,251,0.12), rgba(252,70,107,0.06));
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 30px rgba(13, 30, 70, 0.08);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 60;
}

/* main nav sizing and layout */
.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.65rem 1rem;
}

/* inner flex alignment */
.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Brand style: large, bold, gradient text */
.brand-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.brand {
  display: inline-block;
  font-weight: 800;
  font-size: 1.35rem;
  letter-spacing: 0.06em;
  color: #0f172a;
  text-decoration: none;
  background: linear-gradient(90deg, #4f46e5, #06b6d4);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding: 0.15rem 0.25rem;
  border-radius: 6px;
  transition: transform 220ms ease, filter 220ms ease;
}
/* .brand:hover {
  transform: translateY(-3px);
  filter: drop-shadow(0 6px 18px rgba(79,70,229,0.2));
} */
.brand-accent {
  color: #7c3aed;
  -webkit-text-fill-color: currentColor;
  margin-left: 2px;
}

/* small tagline next to brand */
.brand-tag {
  font-size: 0.78rem;
  color: rgba(15,23,42,0.7);
  font-weight: 600;
  opacity: 0.9;
}

/* Hide native checkbox visually but keep it accessible */
.nav-toggle {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(1px, 1px, 1px, 1px);
}

/* Hamburger label for mobile */
.nav-toggle-label {
  display: none;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 180ms ease;
}
.nav-toggle-label:hover {
  background: rgba(15,23,42,0.04);
}
.hamburger,
.hamburger::before,
.hamburger::after {
  display: block;
  width: 20px;
  height: 2px;
  background: #0f172a;
  border-radius: 2px;
  transition: transform 220ms ease, opacity 220ms ease;
  position: relative;
}
.hamburger::before,
.hamburger::after {
  content: "";
  position: absolute;
  left: 0;
}
.hamburger::before {
  top: -6px;
}
.hamburger::after {
  top: 6px;
}

/* nav links container */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  transition: max-height 300ms ease, opacity 300ms ease;
}

/* link visual style with animated underline */
.nav-link {
  color: rgba(15,23,42,0.85);
  text-decoration: none;
  font-weight: 600;
  padding: 0.55rem 0.4rem;
  position: relative;
  transition: color 180ms ease;
}
.nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 6px;
  width: 0%;
  height: 3px;
  background: linear-gradient(90deg,#7c3aed,#06b6d4);
  border-radius: 2px;
  transition: width 220ms ease;
}
.nav-link:hover {
  color: #0b1220;
}
.nav-link:hover::after {
  width: 100%;
}

/* authentication buttons */
.auth-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: 0.45rem;
}
.greet {
  color: rgba(15,23,42,0.78);
  font-weight: 600;
  font-size: 0.94rem;
}
.btn {
  font-weight: 700;
  border-radius: 10px;
  padding: 0.45rem 0.7rem;
  cursor: pointer;
  border: 1px solid rgba(15,23,42,0.06);
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.btn-primary {
  background: linear-gradient(90deg,#7c3aed,#06b6d4);
  color: white;
  box-shadow: 0 6px 18px rgba(79,70,229,0.16);
}
/* .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(79,70,229,0.18);
} */
.btn-ghost {
  background: rgba(255,255,255,0.85);
  color: #0f172a;
  border: 1px solid rgba(15,23,42,0.06);
}
/* .btn-ghost:hover {
  transform: translateY(-2px);
} */

/* responsive behavior */
@media (max-width: 860px) {
  .nav-inner {
    align-items: center;
  }

  /* show hamburger on smaller screens */
  .nav-toggle-label {
    display: inline-flex;
  }

  /* collapse links into a vertical panel */
  .nav-links {
    position: absolute;
    right: 1rem;
    top: calc(100% + 10px);
    background: rgba(255,255,255,0.98);
    border-radius: 12px;
    box-shadow: 0 12px 30px rgba(12,20,40,0.08);
    padding: 0.6rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
    min-width: 220px;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transform-origin: top right;
  }

  /* show panel when checkbox is checked */
  #nav-toggle:checked ~ .nav-links {
    max-height: 420px;
    opacity: 1;
    transform: translateY(0);
  }

  .nav-link {
    padding: 0.6rem 0.9rem;
    width: 100%;
  }

  .brand-tag {
    display: none;
  }
}

@media (max-width: 420px) {
  .brand {
    font-size: 1.15rem;
  }
  .nav-links {
    right: 0.6rem;
    min-width: 190px;
  }
}
</style>
