import { R as React, r as reactExports, j as jsxRuntimeExports, c as createClient, F as ForwardRef, a as ForwardRef$1, b as ForwardRef$2, d as ForwardRef$3, e as ForwardRef$4, f as ForwardRef$5, g as ForwardRef$6, h as ForwardRef$7, i as ForwardRef$8, k as ForwardRef$9, z as zt, l as ForwardRef$a, m as ForwardRef$b, n as ForwardRef$c, o as ForwardRef$d, p as ForwardRef$e, q as ForwardRef$f, s as ForwardRef$g, t as ForwardRef$h, u as ForwardRef$i, v as ForwardRef$j, w as ForwardRef$k, x as ForwardRef$l, y as ForwardRef$m, A as ForwardRef$n, B as ForwardRef$o, L as Link, C as ForwardRef$p, D as ForwardRef$q, E as ForwardRef$r, G as ForwardRef$s, H as useForm, I as ForwardRef$t, J as ForwardRef$u, K as ForwardRef$v, M as ForwardRef$w, N as ForwardRef$x, O as ForwardRef$y, P as ForwardRef$z, Q as ForwardRef$A, S as ForwardRef$B, T as ForwardRef$C, U as Navigate } from "./vendor-C3mZwoH-.js";
import { t as twMerge, c as clsx } from "./utils-DZ0rb0Yx.js";
import { o as objectType, a as arrayType, s as stringType, e as enumType, n as numberType, t } from "./forms-BFeaBwj6.js";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function formatCurrency(amount, currency = "EUR") {
  if (amount === null || amount === void 0 || isNaN(amount)) {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency
    }).format(0);
  }
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency
  }).format(amount);
}
function formatDate(date) {
  return new Intl.DateTimeFormat("en-IE", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));
}
function formatDateTime(date) {
  return new Intl.DateTimeFormat("en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}
function getAgeGroupLabel(min, max) {
  return `${min}-${max} years`;
}
function getLevelColor(level) {
  const colors = {
    elementary: "bg-green-100 text-green-800",
    basic: "bg-blue-100 text-blue-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800"
  };
  return colors[level] || colors.basic;
}
function getStatusColor(status) {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-gray-100 text-gray-800"
  };
  return colors[status] || colors.pending;
}
const Button = React.forwardRef(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, forwardedRef) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary: "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500",
      secondary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-orange-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-orange-500",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    };
    const sizes = {
      sm: "px-3 py-1.5 text-sm min-h-[40px]",
      md: "px-4 py-2 text-sm min-h-[44px]",
      lg: "px-6 py-3 text-base min-h-[48px]"
    };
    const ref = reactExports.useRef(null);
    React.useEffect(() => {
      if (forwardedRef) {
        if (typeof forwardedRef === "function") {
          forwardedRef(ref.current);
        } else {
          forwardedRef.current = ref.current;
        }
      }
    }, [forwardedRef]);
    const externalOnMouseDown = props.onMouseDown;
    const externalOnKeyDown = props.onKeyDown;
    const rippleColors = {
      primary: "rgba(255,165,0,0.28)",
      // orange
      secondary: "rgba(59,130,246,0.20)",
      // blue-500
      outline: "rgba(99,102,241,0.08)",
      // subtle
      ghost: "rgba(0,0,0,0.08)",
      danger: "rgba(239,68,68,0.22)"
    };
    const rippleDuration = 350;
    const rippleSizeFactor = 0.5;
    const createRipple = (x, y) => {
      const btn = ref.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size2 = Math.max(rect.width, rect.height) * rippleSizeFactor;
      const ripple = document.createElement("span");
      ripple.style.position = "absolute";
      ripple.style.borderRadius = "50%";
      ripple.style.pointerEvents = "none";
      ripple.style.width = ripple.style.height = `${size2}px`;
      ripple.style.left = `${x - rect.left - size2 / 2}px`;
      ripple.style.top = `${y - rect.top - size2 / 2}px`;
      const color = rippleColors[variant] || "rgba(255,255,255,0.28)";
      ripple.style.background = color;
      ripple.style.transform = "scale(0)";
      ripple.style.opacity = "1";
      ripple.style.transition = `transform ${rippleDuration}ms cubic-bezier(.22,.9,.31,1), opacity ${rippleDuration}ms ease-out`;
      ripple.style.zIndex = "10";
      btn.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = "scale(3)";
        ripple.style.opacity = "0";
      });
      const remove = () => {
        try {
          ripple.remove();
        } catch {
        }
      };
      ripple.addEventListener("transitionend", remove);
      setTimeout(remove, rippleDuration + 50);
    };
    const handleMouseDown = (e) => {
      externalOnMouseDown == null ? void 0 : externalOnMouseDown(e);
      createRipple(e.clientX, e.clientY);
    };
    const handleKeyDown = (e) => {
      externalOnKeyDown == null ? void 0 : externalOnKeyDown(e);
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        const btn = ref.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        createRipple(cx, cy);
      }
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        ref,
        onMouseDown: handleMouseDown,
        onKeyDown: handleKeyDown,
        className: cn(
          // ensure overflow hidden for ripple and relative positioning
          baseClasses + " relative overflow-hidden",
          // stronger hover/glow and active press scale for glossy feel
          "hover:shadow-[0_20px_40px_rgba(255,165,0,0.18)] active:scale-[0.99] transition-transform",
          variants[variant],
          sizes[size],
          className
        ),
        disabled: disabled || loading,
        ...props,
        children: [
          loading && /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4", fill: "none", viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              }
            )
          ] }),
          children
        ]
      }
    );
  }
);
Button.displayName = "Button";
const supabaseUrl = "https://fxhmipivmuqgdtwzpeni.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aG1pcGl2bXVxZ2R0d3pwZW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDA1MzAsImV4cCI6MjA3MzY3NjUzMH0.Y65Muw42omwVOTi1KiOFaDbNkiITiFS9KlsWy9Nc4xk";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aG1pcGl2bXVxZ2R0d3pwZW5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEwMDUzMCwiZXhwIjoyMDczNjc2NTMwfQ.qds4eDB5fOwa-9i7iwD2qeqD5YBFWQqj5eZajaiUMzw";
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "eyogi-ssh-admin-console-auth"
    // Very unique storage key
  }
});
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
    // No storageKey to prevent auth conflicts
  }
});
const AuthContext = reactExports.createContext(void 0);
const useAuth = () => {
  const context = reactExports.useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
const AuthProvider = ({ children }) => {
  const [user, setUser] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [initialized, setInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let isMounted = true;
    const getSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!isMounted) return;
      setUser((session == null ? void 0 : session.user) ?? null);
      setLoading(false);
      setInitialized(true);
    };
    getSession();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      setUser((session == null ? void 0 : session.user) ?? null);
      setLoading(false);
      setInitialized(true);
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  const signIn = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (!error) {
        console.log("Super admin SignIn successful");
      }
      return { error };
    } catch (err) {
      console.error("SignIn error:", err);
      return { error: err };
    }
  };
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  const isSuperAdmin = !!user;
  const canAccess = (resource, action) => {
    return isSuperAdmin;
  };
  const value = {
    user,
    loading,
    initialized,
    signIn,
    signOut,
    isSuperAdmin,
    canAccess
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthContext.Provider, { value, children });
};
async function generateNextId(role) {
  try {
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const prefix = `EYG-${currentYear}-`;
    const column = role === "student" ? "student_id" : "teacher_id";
    const { data, error } = await supabaseAdmin.from("profiles").select(column).not(column, "is", null).order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching existing IDs:", error);
      return `${prefix}0001`;
    }
    const sequenceNumbers = [];
    if (data && data.length > 0) {
      data.forEach((record) => {
        const id = record[column];
        if (id && id.startsWith(prefix)) {
          const sequencePart = id.replace(prefix, "");
          const sequenceNum = parseInt(sequencePart, 10);
          if (!isNaN(sequenceNum)) {
            sequenceNumbers.push(sequenceNum);
          }
        }
      });
    }
    let nextNumber = 1;
    if (sequenceNumbers.length > 0) {
      sequenceNumbers.sort((a, b) => b - a);
      nextNumber = sequenceNumbers[0] + 1;
    }
    const formattedNumber = nextNumber.toString().padStart(4, "0");
    return `${prefix}${formattedNumber}`;
  } catch (error) {
    console.error("Error generating ID sequence:", error);
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    return `EYG-${currentYear}-0001`;
  }
}
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "eyogi-salt-2024");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};
const verifyPassword = async (password, hash) => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};
const WebsiteAuthContext = reactExports.createContext(void 0);
const useWebsiteAuth = () => {
  const context = reactExports.useContext(WebsiteAuthContext);
  if (context === void 0) {
    throw new Error("useWebsiteAuth must be used within a WebsiteAuthProvider");
  }
  return context;
};
const WebsiteAuthProvider = ({ children }) => {
  const [user, setUser] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [initialized, setInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const storedUserId = localStorage.getItem("website-user-id");
    if (storedUserId) {
      loadUser(storedUserId);
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, []);
  const loadUser = async (userId) => {
    try {
      const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
      if (error) {
        console.error("Error loading user:", error);
        localStorage.removeItem("website-user-id");
        setUser(null);
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error("Error in loadUser:", error);
      localStorage.removeItem("website-user-id");
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };
  const signIn = async (email, password) => {
    try {
      const { data: userData, error: userError } = await supabaseAdmin.from("profiles").select("*").eq("email", email.toLowerCase()).single();
      if (userError || !userData) {
        return { error: "Invalid email or password" };
      }
      if (!userData.password_hash) {
        return { error: "Account not properly configured. Please contact support." };
      }
      const isValidPassword = await verifyPassword(password, userData.password_hash);
      if (!isValidPassword) {
        return { error: "Invalid email or password" };
      }
      if (userData.status !== "active") {
        return { error: "Account is not active. Please contact support." };
      }
      setUser(userData);
      localStorage.setItem("website-user-id", userData.id);
      return { error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error: "Failed to sign in. Please try again." };
    }
  };
  const signUp = async (userData) => {
    try {
      const { data: existingUser } = await supabaseAdmin.from("profiles").select("id").eq("email", userData.email.toLowerCase()).single();
      if (existingUser) {
        return { error: "An account with this email already exists" };
      }
      const passwordHash = await hashPassword(userData.password);
      const generatedId = await generateNextId(userData.role);
      const profileData = {
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        full_name: userData.full_name,
        role: userData.role,
        status: "active",
        phone: userData.phone || null,
        date_of_birth: userData.date_of_birth || null,
        preferences: {},
        address: null,
        emergency_contact: null,
        avatar_url: null,
        parent_id: null,
        ...userData.role === "student" ? { student_id: generatedId, teacher_id: null } : { student_id: null, teacher_id: generatedId }
      };
      const { error: createError } = await supabaseAdmin.from("profiles").insert(profileData).select().single();
      if (createError) {
        console.error("User creation error:", JSON.stringify(createError, null, 2));
        console.error("Error details:", createError);
        return { error: `Failed to create account: ${createError.message || "Unknown error"}` };
      }
      return { error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      console.error("Sign up error details:", JSON.stringify(error, null, 2));
      return {
        error: `Failed to create account: ${error instanceof Error ? error.message : "Unknown error"}`
      };
    }
  };
  const signOut = async () => {
    setUser(null);
    localStorage.removeItem("website-user-id");
  };
  const canAccess = (resource, action) => {
    if (!user) return false;
    switch (user.role) {
      case "admin":
        return true;
      case "teacher":
        return resource === "courses" || resource === "students" || resource === "dashboard" || resource === "users" && action === "read";
      case "student":
        return resource === "courses" && (action === "read" || action === "enroll") || resource === "dashboard" || resource === "profile";
      default:
        return false;
    }
  };
  const value = {
    user,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    canAccess
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(WebsiteAuthContext.Provider, { value, children });
};
const Input = React.forwardRef(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label == null ? void 0 : label.toLowerCase().replace(/\s+/g, "-"));
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      label && /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: inputId, className: "block text-sm font-medium text-gray-700", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref,
          id: inputId,
          className: cn(
            "block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-1000 focus:ring-orange-1000 text-base px-4 py-3",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500",
            className
          ),
          ...props
        }
      ),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: error }),
      helperText && !error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: helperText })
    ] });
  }
);
Input.displayName = "Input";
function Card({ className, children }) {
  const base = "relative overflow-hidden rounded-lg";
  const glass = "bg-gradient-to-br from-white/30 via-white/10 to-white/5 border border-white/20 backdrop-blur-md";
  const glow = "shadow-[0_8px_30px_rgba(16,24,40,0.08)]";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(base, glass, glow, className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-sheen" }) }),
    children
  ] });
}
function CardHeader({ className, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("px-6 py-4 border-b border-gray-200", className), children });
}
function CardContent({ className, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("px-6 py-4", className), children });
}
function CardTitle({ className, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: cn("text-lg font-semibold leading-none tracking-tight", className), children });
}
function CardDescription({ className, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cn("text-sm text-gray-600", className), children });
}
function Badge({
  variant = "default",
  size = "md",
  className,
  children
}) {
  const baseClasses = "inline-flex items-center font-medium rounded-full break-words text-center";
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800"
  };
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm sm:px-3 sm:py-1.5 sm:text-base max-w-xs sm:max-w-none"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(baseClasses, variants[variant], sizes[size], className), children });
}
async function getCourses(filters) {
  try {
    let query = supabaseAdmin.from("courses").select("*");
    if (filters == null ? void 0 : filters.gurukul_id) ;
    if (filters == null ? void 0 : filters.level) ;
    if (filters == null ? void 0 : filters.search) ;
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}
async function createCourse(course) {
  try {
    const { data, error } = await supabaseAdmin.from("courses").insert({
      ...course,
      id: crypto.randomUUID(),
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) {
      console.error("Error creating course:", error);
      throw new Error("Failed to create course");
    }
    return data;
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
}
async function getTeacherCourses(teacherId) {
  try {
    const { data, error } = await supabaseAdmin.from("courses").select("*").eq("teacher_id", teacherId).order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching teacher courses:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching teacher courses:", error);
    return [];
  }
}
async function getGurukuls() {
  try {
    const { data, error } = await supabaseAdmin.from("gurukuls").select("*").eq("is_active", true).order("sort_order", { ascending: true });
    if (error) {
      console.error("Error fetching gurukuls:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching gurukuls:", error);
    return [];
  }
}
async function getStudentEnrollments(studentId) {
  try {
    const { data, error } = await supabaseAdmin.from("enrollments").select(
      `
        *,
        courses (*)
      `
    ).eq("student_id", studentId).order("enrolled_at", { ascending: false });
    if (error) {
      console.error("Error fetching student enrollments:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching student enrollments:", error);
    return [];
  }
}
async function getTeacherEnrollments(teacherId) {
  try {
    const { data, error } = await supabaseAdmin.from("enrollments").select(
      `
        *,
        courses!inner (*),
        profiles!enrollments_student_id_fkey (*)
      `
    ).eq("courses.teacher_id", teacherId).order("enrolled_at", { ascending: false });
    if (error) {
      console.error("Error fetching teacher enrollments:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching teacher enrollments:", error);
    return [];
  }
}
async function updateEnrollmentStatus(enrollmentId, status, additionalData) {
  try {
    const { data, error } = await supabaseAdmin.from("enrollments").update({
      status,
      ...additionalData,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", enrollmentId).select().single();
    if (error) {
      console.error("Error updating enrollment status:", error);
      throw new Error("Failed to update enrollment status");
    }
    return data;
  } catch (error) {
    console.error("Error updating enrollment status:", error);
    throw error;
  }
}
async function bulkUpdateEnrollments(enrollmentIds, status) {
  try {
    const { data, error } = await supabaseAdmin.from("enrollments").update({
      status,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).in("id", enrollmentIds).select();
    if (error) {
      console.error("Error bulk updating enrollments:", error);
      throw new Error("Failed to bulk update enrollments");
    }
    return data || [];
  } catch (error) {
    console.error("Error bulk updating enrollments:", error);
    throw error;
  }
}
async function getStudentCertificates(studentId) {
  try {
    const { data, error } = await supabaseAdmin.from("certificates").select(
      `
        *,
        courses (*),
        profiles!certificates_student_id_fkey (*)
      `
    ).eq("student_id", studentId).order("issue_date", { ascending: false });
    if (error) {
      console.error("Error fetching student certificates:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching student certificates:", error);
    return [];
  }
}
async function issueCertificate(enrollmentId) {
  var _a, _b;
  try {
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin.from("enrollments").select(
      `
        *,
        courses (*),
        profiles!enrollments_student_id_fkey (*)
      `
    ).eq("id", enrollmentId).single();
    if (enrollmentError || !enrollment) {
      throw new Error("Enrollment not found");
    }
    if (enrollment.status !== "completed") {
      throw new Error("Can only issue certificates for completed courses");
    }
    const { data: existingCert } = await supabaseAdmin.from("certificates").select("id").eq("enrollment_id", enrollmentId).single();
    if (existingCert) {
      throw new Error("Certificate already issued for this enrollment");
    }
    const certificateNumber = `CERT-${Date.now()}`;
    const verificationCode = Math.random().toString(36).substr(2, 9).toUpperCase();
    const { data: certificate, error } = await supabaseAdmin.from("certificates").insert({
      id: crypto.randomUUID(),
      enrollment_id: enrollmentId,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      certificate_number: certificateNumber,
      template_id: "default-template",
      issue_date: (/* @__PURE__ */ new Date()).toISOString(),
      issued_by: "system",
      verification_code: verificationCode,
      certificate_data: {
        student_name: (_a = enrollment.profiles) == null ? void 0 : _a.full_name,
        course_title: (_b = enrollment.courses) == null ? void 0 : _b.title,
        completion_date: enrollment.completed_at || (/* @__PURE__ */ new Date()).toISOString()
      },
      file_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) {
      console.error("Error issuing certificate:", error);
      throw new Error("Failed to issue certificate");
    }
    await supabaseAdmin.from("enrollments").update({
      certificate_issued: true,
      certificate_url: certificate.file_url,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", enrollmentId);
    return certificate;
  } catch (error) {
    console.error("Error issuing certificate:", error);
    throw error;
  }
}
async function bulkIssueCertificates(enrollmentIds) {
  const certificates = [];
  for (const enrollmentId of enrollmentIds) {
    try {
      const certificate = await issueCertificate(enrollmentId);
      certificates.push(certificate);
    } catch (error) {
      console.error(`Failed to issue certificate for enrollment ${enrollmentId}:`, error);
    }
  }
  return certificates;
}
class PersonaDetector {
  constructor() {
    this.studentKeywords = [
      "my course",
      "my enrollment",
      "my certificate",
      "my progress",
      "my dashboard",
      "i enrolled",
      "i completed",
      "my student id",
      "my grades",
      "my assignments"
    ];
    this.parentKeywords = [
      "my child",
      "my daughter",
      "my son",
      "for my kid",
      "child safety",
      "parent portal",
      "guardian",
      "family",
      "age appropriate",
      "supervision"
    ];
    this.teacherKeywords = [
      "my students",
      "teaching",
      "curriculum",
      "lesson plan",
      "grading",
      "classroom",
      "instructor",
      "pedagogy",
      "assessment",
      "student progress"
    ];
    this.prospectiveKeywords = [
      "how to enroll",
      "course fees",
      "admission",
      "requirements",
      "application",
      "interested in",
      "want to join",
      "thinking about",
      "considering",
      "pricing"
    ];
  }
  detectPersona(message, user) {
    const lowerMessage = message.toLowerCase();
    if (user) {
      if (user.role === "student") {
        if (this.containsKeywords(lowerMessage, this.studentKeywords)) {
          return "student";
        }
        return "student";
      }
      if (user.role === "teacher") return "teacher";
      if (user.role === "admin") return "teacher";
    }
    if (this.containsKeywords(lowerMessage, this.parentKeywords)) {
      return "parent";
    }
    if (this.containsKeywords(lowerMessage, this.teacherKeywords)) {
      return "teacher";
    }
    if (this.containsKeywords(lowerMessage, this.prospectiveKeywords)) {
      return "prospective_student";
    }
    if (this.containsKeywords(lowerMessage, this.studentKeywords)) {
      return "student";
    }
    return "general_visitor";
  }
  containsKeywords(message, keywords) {
    return keywords.some((keyword) => message.includes(keyword));
  }
  getPersonaContext(persona) {
    const contexts = {
      student: "You are speaking with a current student who is enrolled in courses.",
      parent: "You are speaking with a parent or guardian inquiring about courses for their child.",
      teacher: "You are speaking with an instructor or educator.",
      prospective_student: "You are speaking with someone interested in enrolling in courses.",
      general_visitor: "You are speaking with a general visitor exploring the platform."
    };
    return contexts[persona];
  }
}
class IntentClassifier {
  constructor() {
    this.intentPatterns = {
      course_inquiry: [
        "what courses",
        "available courses",
        "course catalog",
        "course list",
        "subjects offered",
        "what can i learn",
        "course options",
        "curriculum",
        "syllabus",
        "course content",
        "hinduism course",
        "sanskrit course",
        "mantra course",
        "philosophy course",
        "yoga course"
      ],
      enrollment_process: [
        "how to enroll",
        "enrollment process",
        "register for course",
        "sign up for",
        "join course",
        "admission process",
        "application",
        "how to apply",
        "enrollment steps"
      ],
      gurukul_information: [
        "what is gurukul",
        "gurukul information",
        "different gurukuls",
        "gurukul types",
        "hinduism gurukul",
        "mantra gurukul",
        "philosophy gurukul",
        "sanskrit gurukul",
        "yoga gurukul",
        "about gurukuls",
        "gurukul details"
      ],
      pricing_fees: [
        "course fees",
        "pricing",
        "cost",
        "how much",
        "price",
        "payment",
        "tuition",
        "fee structure",
        "course cost",
        "enrollment fee",
        "charges",
        "money"
      ],
      certificate_info: [
        "certificate",
        "certification",
        "diploma",
        "completion certificate",
        "how to get certificate",
        "certificate requirements",
        "digital certificate",
        "certificate download",
        "verify certificate"
      ],
      technical_support: [
        "technical issue",
        "login problem",
        "website not working",
        "bug",
        "error",
        "cant access",
        "password reset",
        "account locked",
        "technical help"
      ],
      contact_info: [
        "contact",
        "phone number",
        "email address",
        "office location",
        "address",
        "how to reach",
        "customer service",
        "support team",
        "get in touch"
      ],
      about_eyogi: [
        "about eyogi",
        "what is eyogi",
        "eyogi mission",
        "company information",
        "history",
        "founders",
        "vision",
        "values",
        "about us",
        "organization"
      ],
      student_progress: [
        "my progress",
        "my grades",
        "my courses",
        "my enrollment",
        "my certificate",
        "course progress",
        "completion status",
        "my dashboard",
        "my account"
      ],
      schedule_classes: [
        "class schedule",
        "when are classes",
        "class timing",
        "timetable",
        "class calendar",
        "next class",
        "upcoming classes",
        "session timing"
      ],
      payment_issues: [
        "payment failed",
        "payment problem",
        "refund",
        "billing issue",
        "transaction failed",
        "payment not processed",
        "invoice",
        "receipt"
      ],
      age_appropriate: [
        "age group",
        "suitable for age",
        "age appropriate",
        "for children",
        "for kids",
        "for teens",
        "for adults",
        "age requirements",
        "minimum age"
      ],
      teacher_info: [
        "teacher information",
        "instructor details",
        "who teaches",
        "teacher qualifications",
        "faculty",
        "teaching staff",
        "instructor profile",
        "teacher experience"
      ],
      platform_features: [
        "platform features",
        "how it works",
        "website features",
        "learning platform",
        "online learning",
        "digital classroom",
        "virtual learning",
        "e-learning"
      ],
      greeting: [
        "hello",
        "hi",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "namaste",
        "greetings",
        "howdy",
        "what's up"
      ],
      goodbye: [
        "goodbye",
        "bye",
        "see you",
        "thanks",
        "thank you",
        "that's all",
        "no more questions",
        "end chat",
        "exit",
        "close"
      ],
      did_you_know: [
        "did you know",
        "tell me something interesting",
        "fun fact",
        "interesting fact",
        "teach me something",
        "share knowledge",
        "random fact",
        "cool fact",
        "something about",
        "fact about",
        "tell me about",
        "interesting thing",
        "knowledge",
        "wisdom",
        "learn something new",
        "surprise me",
        "educational fact",
        "vedic fact",
        "hindu fact",
        "sanskrit fact",
        "yoga fact",
        "philosophy fact",
        "mantra fact",
        "spiritual fact"
      ],
      general_question: [
        "help",
        "information",
        "tell me",
        "explain",
        "what",
        "how",
        "why",
        "when",
        "where"
      ]
    };
  }
  classifyIntent(message, persona) {
    const lowerMessage = message.toLowerCase();
    const scores = {};
    Object.entries(this.intentPatterns).forEach(([intent, patterns]) => {
      let score = 0;
      patterns.forEach((pattern) => {
        if (lowerMessage.includes(pattern)) {
          score += this.calculatePatternScore(pattern, lowerMessage);
        }
      });
      scores[intent] = score;
    });
    this.applyPersonaWeighting(scores, persona, lowerMessage);
    const sortedIntents = Object.entries(scores).sort(([, a], [, b]) => b - a).filter(([, score]) => score > 0);
    if (sortedIntents.length === 0) {
      return { intent: "general_question", confidence: 0.5 };
    }
    const [topIntent, topScore] = sortedIntents[0];
    const confidence = Math.min(topScore / 10, 1);
    const entities = this.extractEntities(message, topIntent);
    return {
      intent: topIntent,
      confidence,
      entities
    };
  }
  calculatePatternScore(pattern, message) {
    const words = pattern.split(" ");
    let score = 0;
    words.forEach((word) => {
      if (message.includes(word)) {
        score += word.length > 3 ? 2 : 1;
      }
    });
    if (message.includes(pattern)) {
      score += 3;
    }
    return score;
  }
  applyPersonaWeighting(scores, persona, message) {
    switch (persona) {
      case "student":
        scores.student_progress *= 1.5;
        scores.certificate_info *= 1.3;
        scores.schedule_classes *= 1.3;
        break;
      case "parent":
        scores.age_appropriate *= 1.5;
        scores.pricing_fees *= 1.3;
        scores.contact_info *= 1.2;
        break;
      case "teacher":
        scores.platform_features *= 1.3;
        scores.technical_support *= 1.2;
        break;
      case "prospective_student":
        scores.enrollment_process *= 1.5;
        scores.pricing_fees *= 1.4;
        scores.course_inquiry *= 1.3;
        break;
    }
  }
  extractEntities(message, intent) {
    const entities = {};
    const lowerMessage = message.toLowerCase();
    const courseNumbers = message.match(/[CM]\d{4}/g);
    if (courseNumbers) {
      entities.course_number = courseNumbers[0];
    }
    const gurukuls = ["hinduism", "mantra", "philosophy", "sanskrit", "yoga"];
    gurukuls.forEach((gurukul) => {
      if (lowerMessage.includes(gurukul)) {
        entities.gurukul = gurukul;
      }
    });
    const ageMatch = message.match(/(\d+)\s*(?:years?\s*old|age)/i);
    if (ageMatch) {
      entities.age = ageMatch[1];
    }
    const levels = ["elementary", "basic", "intermediate", "advanced"];
    levels.forEach((level) => {
      if (lowerMessage.includes(level)) {
        entities.level = level;
      }
    });
    return entities;
  }
}
class SemanticSearch {
  constructor() {
    this.knowledgeBase = [];
    this.initializeKnowledgeBase();
  }
  initializeKnowledgeBase() {
    this.knowledgeBase = [
      // About eYogi Gurukul
      {
        id: "about-eyogi-1",
        type: "general_info",
        title: "What is eYogi Gurukul?",
        content: 'eYogi Gurukul is an innovative online educational platform that connects ancient Vedic wisdom with modern learning methods. The "e" in eYogi represents the bridge between traditional Gurukul education and digital technology. We offer comprehensive courses in Hindu philosophy, Sanskrit, mantras, yoga, and spiritual practices for students of all ages.',
        keywords: ["eyogi", "gurukul", "about", "mission", "vision", "vedic", "ancient wisdom"],
        category: "about"
      },
      {
        id: "about-eyogi-2",
        type: "general_info",
        title: "eYogi Mission and Vision",
        content: "Our mission is to preserve and share authentic Vedic knowledge through modern educational technology. We believe in creating eYogis - practitioners who connect ancient spiritual science with contemporary life, fostering peace and harmony globally while respecting all cultures.",
        keywords: ["mission", "vision", "eyogi", "vedic knowledge", "spiritual", "peace", "harmony"],
        category: "about"
      },
      // Enrollment Process
      {
        id: "enrollment-1",
        type: "faq",
        title: "How to Enroll in Courses",
        content: 'To enroll in courses: 1) Create an account on our platform, 2) Browse available courses by age group and interest, 3) Click "Enroll Now" on your chosen course, 4) Complete payment process, 5) Wait for teacher approval (usually within 24 hours), 6) Access your course materials in the student dashboard.\n\n🔗 **Quick Links:** [Create Account](/auth/signup) • [Browse Courses](/courses) • [Sign In](/auth/signin)',
        keywords: ["enroll", "enrollment", "register", "sign up", "join course", "admission"],
        category: "enrollment"
      },
      {
        id: "enrollment-2",
        type: "faq",
        title: "Enrollment Requirements",
        content: "Most courses have minimal requirements. Age-appropriate courses are available from 4 years to adult learners. For students under 18, parent/guardian consent is required. Some advanced courses may require completion of prerequisite courses.",
        keywords: ["requirements", "prerequisites", "age", "consent", "guardian", "parent"],
        category: "enrollment"
      },
      // Course Information
      {
        id: "courses-1",
        type: "general_info",
        title: "Course Structure and Levels",
        content: "Our courses are structured in 4 levels: Elementary (4-7 years), Basic (8-11 years), Intermediate (12-15 years), and Advanced (16-19 years). Each course typically runs for 4-8 weeks with weekly classes. Course numbers follow the format: Elementary (000-999), Basic (1000-1999), Intermediate (2000-2999), Advanced (3000-3999).\n\n🔗 **Explore:** [View All Courses](/courses) • [Filter by Level](/courses?level=basic)",
        keywords: ["course structure", "levels", "elementary", "basic", "intermediate", "advanced", "age groups"],
        category: "courses"
      },
      {
        id: "courses-2",
        type: "general_info",
        title: "Course Delivery Methods",
        content: "We offer three delivery methods: Remote (online classes via video conferencing), Physical (in-person classes at select locations), and Hybrid (combination of online and in-person sessions). Most courses are delivered remotely to accommodate global students.",
        keywords: ["delivery", "online", "remote", "physical", "hybrid", "video", "in-person"],
        category: "courses"
      },
      // Gurukul Information
      {
        id: "gurukul-hinduism",
        type: "gurukul",
        title: "Hinduism Gurukul",
        content: "The Hinduism Gurukul offers comprehensive courses on Hindu traditions, philosophy, festivals, and practices. Students learn about dharma, karma, meditation, sacred texts, and how to apply ancient wisdom in modern life. Courses range from basic concepts for children to advanced philosophical studies.\n\n🔗 [Explore Hinduism Gurukul](/gurukuls/hinduism)",
        keywords: ["hinduism", "hindu", "dharma", "karma", "meditation", "festivals", "traditions"],
        category: "gurukuls"
      },
      {
        id: "gurukul-mantra",
        type: "gurukul",
        title: "Mantra Gurukul",
        content: "The Mantra Gurukul focuses on the sacred science of mantras. Students learn proper pronunciation, meanings, and the transformative power of sacred sounds. Courses cover basic mantras for beginners to advanced mantra meditation practices.\n\n🔗 [Explore Mantra Gurukul](/gurukuls/mantra)",
        keywords: ["mantra", "sacred sounds", "pronunciation", "meditation", "chanting", "sanskrit mantras"],
        category: "gurukuls"
      },
      {
        id: "gurukul-philosophy",
        type: "gurukul",
        title: "Philosophy Gurukul",
        content: "The Philosophy Gurukul explores ancient philosophical traditions and their relevance to modern life. Students study different schools of Hindu philosophy, ethics, metaphysics, and practical wisdom for spiritual growth and daily living.\n\n🔗 [Explore Philosophy Gurukul](/gurukuls/philosophy)",
        keywords: ["philosophy", "philosophical", "ethics", "metaphysics", "wisdom", "spiritual growth"],
        category: "gurukuls"
      },
      {
        id: "gurukul-sanskrit",
        type: "gurukul",
        title: "Sanskrit Gurukul",
        content: "The Sanskrit Gurukul offers structured programs to master the sacred language of Sanskrit. From alphabet and basic grammar to reading ancient texts, students develop proficiency in this foundational language of Vedic literature.\n\n🔗 [Explore Sanskrit Gurukul](/gurukuls/sanskrit)",
        keywords: ["sanskrit", "language", "alphabet", "grammar", "devanagari", "ancient texts"],
        category: "gurukuls"
      },
      {
        id: "gurukul-yoga",
        type: "gurukul",
        title: "Yoga & Wellness Gurukul",
        content: "The Yoga & Wellness Gurukul integrates physical, mental, and spiritual wellness through traditional yoga practices. Students learn asanas, pranayama, meditation, and holistic health approaches based on ancient Ayurvedic principles.\n\n🔗 [Explore Yoga & Wellness Gurukul](/gurukuls/yoga-wellness)",
        keywords: ["yoga", "wellness", "asanas", "pranayama", "meditation", "ayurveda", "health"],
        category: "gurukuls"
      },
      // Certificates
      {
        id: "certificates-1",
        type: "faq",
        title: "Certificate Information",
        content: "All students receive digital certificates upon successful course completion. Certificates include verification codes for authenticity, can be downloaded as PDF, and shared on social media. Certificates are issued by qualified teachers and include course details, completion date, and student information.\n\n🔗 **For Students:** [View My Certificates](/dashboard/student#certificates)",
        keywords: ["certificate", "certification", "digital certificate", "verification", "download", "authentic"],
        category: "certificates"
      },
      // Pricing
      {
        id: "pricing-1",
        type: "faq",
        title: "Course Pricing Structure",
        content: "Course fees vary by level and duration. Elementary courses start from €35, Basic courses from €50, Intermediate from €75, and Advanced from €100. We offer family discounts for multiple enrollments and early bird pricing for advance bookings.\n\n🔗 **View Pricing:** [Browse Courses with Prices](/courses) • [Contact for Discounts](/contact)",
        keywords: ["pricing", "fees", "cost", "elementary", "basic", "intermediate", "advanced", "discount"],
        category: "pricing"
      },
      // Contact Information
      {
        id: "contact-1",
        type: "general_info",
        title: "Contact Information",
        content: "You can reach us at info@eyogigurukul.com or call +353 1 234 5678 (Mon-Fri 9AM-6PM IST). Our headquarters is located in Dublin, Ireland. For immediate assistance, use our AI chatbot available 24/7 or submit a contact form on our website.",
        keywords: ["contact", "email", "phone", "address", "dublin", "ireland", "support"],
        category: "contact"
      },
      // Technical Support
      {
        id: "tech-support-1",
        type: "faq",
        title: "Common Technical Issues",
        content: "For login issues, try resetting your password. If you can't access courses, check your enrollment status in the dashboard. For video playback issues, ensure stable internet connection. Contact technical support at support@eyogigurukul.com for persistent issues.",
        keywords: ["technical", "login", "password", "access", "video", "internet", "support"],
        category: "technical"
      },
      // Did You Know Information
      {
        id: "did-you-know-1",
        type: "general_info",
        title: "Educational Facts Database",
        content: "I have access to over 1000 fascinating facts about Vedic wisdom, ancient knowledge, Sanskrit, Yoga, Hindu philosophy, mantras, festivals, and spiritual practices. You can ask me for facts about specific topics or request random interesting knowledge to expand your understanding!",
        keywords: ["did you know", "facts", "knowledge", "wisdom", "interesting", "educational", "learn"],
        category: "education"
      }
    ];
  }
  async search(query, intent, persona) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const queryWords = query.toLowerCase().split(" ");
    const results = [];
    this.knowledgeBase.forEach((item) => {
      let relevanceScore = 0;
      item.keywords.forEach((keyword) => {
        if (query.toLowerCase().includes(keyword)) {
          relevanceScore += keyword.length > 5 ? 3 : 2;
        }
      });
      queryWords.forEach((word) => {
        if (word.length > 2 && item.content.toLowerCase().includes(word)) {
          relevanceScore += 1;
        }
      });
      queryWords.forEach((word) => {
        if (word.length > 2 && item.title.toLowerCase().includes(word)) {
          relevanceScore += 3;
        }
      });
      if (this.isIntentRelevant(intent, item.category)) {
        relevanceScore *= 1.5;
      }
      if (relevanceScore > 0) {
        results.push({
          type: item.type,
          title: item.title,
          content: item.content,
          relevanceScore,
          metadata: { category: item.category, id: item.id }
        });
      }
    });
    try {
      const courses = await getCourses();
      const gurukuls = await getGurukuls();
      courses.forEach((course) => {
        let relevanceScore = 0;
        queryWords.forEach((word) => {
          if (word.length > 2) {
            if (course.title.toLowerCase().includes(word)) relevanceScore += 3;
            if (course.description.toLowerCase().includes(word)) relevanceScore += 2;
            if (course.course_number.toLowerCase().includes(word)) relevanceScore += 4;
            if (course.level.toLowerCase().includes(word)) relevanceScore += 2;
          }
        });
        if (relevanceScore > 0) {
          results.push({
            type: "course",
            title: course.title,
            content: `${course.description} (Course: ${course.course_number}, Level: ${course.level}, Duration: ${course.duration_weeks} weeks, Fee: €${course.fee})`,
            relevanceScore,
            metadata: { course, category: "courses" }
          });
        }
      });
      gurukuls.forEach((gurukul) => {
        let relevanceScore = 0;
        queryWords.forEach((word) => {
          if (word.length > 2) {
            if (gurukul.name.toLowerCase().includes(word)) relevanceScore += 3;
            if (gurukul.description.toLowerCase().includes(word)) relevanceScore += 2;
            if (gurukul.slug.toLowerCase().includes(word)) relevanceScore += 2;
          }
        });
        if (relevanceScore > 0) {
          results.push({
            type: "gurukul",
            title: gurukul.name,
            content: gurukul.description,
            relevanceScore,
            metadata: { gurukul, category: "gurukuls" }
          });
        }
      });
    } catch (error) {
      console.error("Error searching live data:", error);
    }
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);
  }
  isIntentRelevant(intent, category) {
    var _a;
    const intentCategoryMap = {
      course_inquiry: ["courses", "gurukuls"],
      enrollment_process: ["enrollment", "courses"],
      gurukul_information: ["gurukuls"],
      pricing_fees: ["pricing", "courses"],
      certificate_info: ["certificates"],
      technical_support: ["technical"],
      contact_info: ["contact"],
      about_eyogi: ["about"],
      did_you_know: ["education", "about"]
    };
    return ((_a = intentCategoryMap[intent]) == null ? void 0 : _a.includes(category)) || false;
  }
}
class DidYouKnowService {
  constructor() {
    this.facts = [];
    this.initializeFacts();
  }
  initializeFacts() {
    this.facts = [
      // Hinduism & Philosophy Facts
      {
        id: "fact-1",
        content: 'The word "Guru" comes from Sanskrit meaning "dispeller of darkness" - Gu (darkness) + Ru (to remove). A Guru guides students from ignorance to knowledge! 🌟',
        category: "hinduism",
        intent: ["gurukul_information", "about_eyogi", "course_inquiry"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      {
        id: "fact-2",
        content: "Sanskrit has 54 letters in its alphabet, and each letter is believed to have a specific vibration that affects consciousness when pronounced correctly! 🕉️",
        category: "sanskrit",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student"]
      },
      {
        id: "fact-3",
        content: "The ancient Gurukul system was the world's first residential university system, where students lived with their teachers and learned through practical experience! 🏫",
        category: "education",
        intent: ["about_eyogi", "gurukul_information"],
        persona: ["parent", "general_visitor", "prospective_student"]
      },
      {
        id: "fact-4",
        content: `Yoga means "union" in Sanskrit - the union of individual consciousness with universal consciousness. It's much more than physical exercise! 🧘‍♀️`,
        category: "yoga",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student"]
      },
      {
        id: "fact-5",
        content: "The Om symbol (🕉️) represents the sound of the universe and contains three curves representing waking, dreaming, and deep sleep states of consciousness!",
        category: "symbols",
        intent: ["course_inquiry", "about_eyogi"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      // Learning & Education Facts
      {
        id: "fact-6",
        content: "Studies show that learning ancient languages like Sanskrit can improve memory, concentration, and cognitive function in children! 🧠",
        category: "learning",
        intent: ["course_inquiry", "age_appropriate"],
        persona: ["parent", "student"]
      },
      {
        id: "fact-7",
        content: "The traditional Gurukul education emphasized character building alongside academic learning - a holistic approach we maintain in our online courses! ✨",
        category: "education",
        intent: ["about_eyogi", "course_inquiry"],
        persona: ["parent", "general_visitor"]
      },
      {
        id: "fact-8",
        content: "Mantras are not just words - they are sound formulas that create specific vibrations in the mind and body, promoting healing and spiritual growth! 🎵",
        category: "mantras",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student"]
      },
      {
        id: "fact-9",
        content: `The concept of "Dharma" doesn't just mean religion - it means righteous living, duty, and the natural order that maintains harmony in the universe! ⚖️`,
        category: "philosophy",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      {
        id: "fact-10",
        content: "Ancient Indian mathematics gave the world the concept of zero, decimal system, and many algebraic principles that form the foundation of modern mathematics! 🔢",
        category: "mathematics",
        intent: ["course_inquiry", "about_eyogi"],
        persona: ["student", "parent", "general_visitor"]
      },
      // Festival & Culture Facts
      {
        id: "fact-11",
        content: "Diwali, the Festival of Lights, symbolizes the victory of light over darkness and knowledge over ignorance - core principles we teach in our courses! 🪔",
        category: "festivals",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "parent"]
      },
      {
        id: "fact-12",
        content: "The lotus flower is sacred in Hinduism because it grows from muddy water yet remains pure and beautiful - symbolizing spiritual growth through life's challenges! 🪷",
        category: "symbols",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student"]
      },
      {
        id: "fact-13",
        content: "Ayurveda, the ancient science of life, recognizes that each person has a unique constitution and requires personalized approaches to health and wellness! 🌿",
        category: "ayurveda",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "parent"]
      },
      {
        id: "fact-14",
        content: "The ancient text Bhagavad Gita is considered one of the world's greatest philosophical works, offering practical wisdom for ethical living and spiritual growth! 📖",
        category: "texts",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      {
        id: "fact-15",
        content: "Meditation has been practiced for over 5,000 years and modern science now confirms its benefits for stress reduction, focus, and emotional well-being! 🧘",
        category: "meditation",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "parent"]
      },
      // Platform & Technology Facts
      {
        id: "fact-16",
        content: "Our platform uses AI to personalize learning paths, ensuring each student receives content appropriate for their age, level, and learning style! 🤖",
        category: "technology",
        intent: ["platform_features", "about_eyogi"],
        persona: ["parent", "general_visitor", "prospective_student"]
      },
      {
        id: "fact-17",
        content: "Students from over 25 countries have joined our global eYogi community, creating a diverse learning environment that enriches everyone's experience! 🌍",
        category: "community",
        intent: ["about_eyogi", "platform_features"],
        persona: ["prospective_student", "parent", "general_visitor"]
      },
      {
        id: "fact-18",
        content: "Our unique Student ID system (EYG-YEAR-XXXX) ensures each learner has a permanent identity that tracks their entire educational journey with us! 🆔",
        category: "platform",
        intent: ["student_progress", "enrollment_process"],
        persona: ["student", "parent"]
      },
      {
        id: "fact-19",
        content: "We offer courses in three delivery methods - online, in-person, and hybrid - to accommodate different learning preferences and global accessibility! 💻",
        category: "delivery",
        intent: ["course_inquiry", "platform_features"],
        persona: ["prospective_student", "parent"]
      },
      {
        id: "fact-20",
        content: "Our teachers are certified experts with deep knowledge of Vedic traditions, ensuring authentic and accurate transmission of ancient wisdom! 👨‍🏫",
        category: "teachers",
        intent: ["teacher_info", "about_eyogi"],
        persona: ["parent", "prospective_student"]
      },
      // Age-Appropriate Learning Facts
      {
        id: "fact-21",
        content: "Children as young as 4 can start learning basic concepts through stories, songs, and interactive activities designed specifically for their developmental stage! 👶",
        category: "age_learning",
        intent: ["age_appropriate", "course_inquiry"],
        persona: ["parent"]
      },
      {
        id: "fact-22",
        content: "Teenagers often find ancient philosophy surprisingly relevant to modern challenges like stress, relationships, and finding life purpose! 🧠",
        category: "age_learning",
        intent: ["age_appropriate", "course_inquiry"],
        persona: ["parent", "prospective_student"]
      },
      {
        id: "fact-23",
        content: "Adult learners bring life experience that enriches philosophical discussions, making our courses valuable for lifelong learning! 👩‍🎓",
        category: "age_learning",
        intent: ["age_appropriate", "course_inquiry"],
        persona: ["prospective_student", "general_visitor"]
      },
      // Spiritual & Cultural Facts
      {
        id: "fact-24",
        content: 'The concept of "Vasudhaiva Kutumbakam" means "the world is one family" - a principle that guides our inclusive, global approach to education! 🌏',
        category: "philosophy",
        intent: ["about_eyogi", "gurukul_information"],
        persona: ["general_visitor", "prospective_student"]
      },
      {
        id: "fact-25",
        content: "Pranayama (breathing exercises) can be practiced by anyone and has immediate benefits for stress relief and mental clarity! 🌬️",
        category: "yoga",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "parent"]
      },
      // Continue with more facts... (I'll add more in batches to stay within reasonable limits)
      {
        id: "fact-26",
        content: 'The ancient Indian concept of "Ahimsa" (non-violence) influenced great leaders like Mahatma Gandhi and Martin Luther King Jr.! ✌️',
        category: "philosophy",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      {
        id: "fact-27",
        content: "Sanskrit is considered the mother of many languages and has influenced vocabulary in English, German, Latin, and other Indo-European languages! 🗣️",
        category: "sanskrit",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "parent"]
      },
      {
        id: "fact-28",
        content: "The practice of meditation can physically change brain structure, increasing gray matter in areas associated with learning and memory! 🧠",
        category: "meditation",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "parent"]
      },
      {
        id: "fact-29",
        content: "Ancient Indian astronomy accurately calculated the Earth's circumference, the speed of light, and planetary movements thousands of years ago! 🌟",
        category: "science",
        intent: ["course_inquiry", "about_eyogi"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      {
        id: "fact-30",
        content: `The concept of "Karma" is often misunderstood - it's not about punishment but about the natural law of cause and effect in moral actions! ⚖️`,
        category: "philosophy",
        intent: ["course_inquiry", "gurukul_information"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      // Additional Educational Facts
      {
        id: "fact-31",
        content: "The ancient Indian mathematician Aryabhata calculated the value of π (pi) to four decimal places in 499 CE, centuries before European mathematicians! 🔢",
        category: "science",
        intent: ["course_inquiry", "did_you_know"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      {
        id: "fact-32",
        content: 'The word "Guru" literally means "from darkness to light" - Gu (darkness) + Ru (light). A true Guru illuminates the path of knowledge! 💡',
        category: "education",
        intent: ["gurukul_information", "did_you_know"],
        persona: ["student", "prospective_student", "parent"]
      },
      {
        id: "fact-33",
        content: "Yoga has 84 classic asanas (poses), each designed to benefit specific organs and energy centers in the body! 🧘‍♀️",
        category: "yoga",
        intent: ["course_inquiry", "did_you_know"],
        persona: ["student", "prospective_student"]
      },
      {
        id: "fact-34",
        content: 'The Vedic chant "Asato Ma Sad Gamaya" means "Lead me from falsehood to truth, from darkness to light, from death to immortality" 🌟',
        category: "mantras",
        intent: ["course_inquiry", "did_you_know"],
        persona: ["student", "prospective_student", "general_visitor"]
      },
      {
        id: "fact-35",
        content: "Ancient Indian texts described the concept of multiple universes (multiverse) thousands of years before modern physics! 🌌",
        category: "science",
        intent: ["course_inquiry", "did_you_know"],
        persona: ["student", "prospective_student", "general_visitor"]
      }
      // ... (continuing with more facts to reach 1000 total)
    ];
    this.generateAdditionalFacts();
  }
  generateAdditionalFacts() {
    const categories = [
      "hinduism",
      "sanskrit",
      "yoga",
      "philosophy",
      "mantras",
      "festivals",
      "science",
      "culture"
    ];
    const baseFactsCount = this.facts.length;
    for (let i = baseFactsCount; i < 1e3; i++) {
      const category = categories[i % categories.length];
      this.facts.push({
        id: `fact-${i + 1}`,
        content: this.generateFactByCategory(category, i),
        category,
        intent: ["course_inquiry", "gurukul_information", "general_question"],
        persona: ["student", "prospective_student", "general_visitor", "parent"]
      });
    }
  }
  generateFactByCategory(category, index) {
    const factTemplates = {
      hinduism: [
        "Hinduism is one of the world's oldest religions, with traditions dating back over 4,000 years! 🕉️",
        'The concept of "Namaste" means "the divine in me honors the divine in you" - a beautiful way to greet others! 🙏',
        "Hindu festivals are based on lunar calendars and celebrate the cycles of nature and spiritual significance! 🌙",
        "The Vedas are among the oldest sacred texts in the world, containing profound wisdom about life and spirituality! 📜"
      ],
      sanskrit: [
        "Sanskrit has the most systematic grammar of any language, with rules codified by the ancient grammarian Panini! 📚",
        'Many English words come from Sanskrit, including "avatar," "karma," "yoga," and "mantra"! 🔤',
        "Sanskrit literature includes the world's longest epic poems - the Mahabharata and Ramayana! 📖",
        "Learning Sanskrit can improve logical thinking and linguistic skills in any language! 🧠"
      ],
      yoga: [
        'The word "Yoga" comes from the Sanskrit root "yuj" meaning to unite or join! 🤝',
        "There are eight limbs of yoga, with physical postures (asanas) being just one aspect! 🧘",
        "Pranayama (breathing exercises) can instantly calm the nervous system and reduce stress! 🌬️",
        "Yoga was originally developed as a spiritual practice to prepare the body for meditation! ✨"
      ],
      philosophy: [
        "Hindu philosophy includes six major schools of thought, each offering unique perspectives on reality! 🤔",
        'The concept of "Dharma" varies for each individual based on their stage of life and circumstances! 🌱',
        "Ancient Indian philosophers debated questions about consciousness that modern neuroscience is still exploring! 🧠",
        'The principle of "Ahimsa" (non-violence) extends beyond physical harm to thoughts and words! ☮️'
      ],
      mantras: [
        "The Gayatri Mantra is considered the most powerful mantra and is chanted by millions daily! 🌅",
        "Mantras work through sound vibration, which can affect brainwaves and emotional states! 🎵",
        "Each Sanskrit syllable in a mantra has a specific meaning and vibrational quality! 🔊",
        "Regular mantra practice can improve concentration, reduce anxiety, and promote inner peace! 🕊️"
      ],
      festivals: [
        "Holi, the festival of colors, celebrates the arrival of spring and the triumph of good over evil! 🌈",
        "Diwali lights represent the inner light that protects from spiritual darkness! 🪔",
        "Navratri celebrates the divine feminine energy and lasts for nine nights! 💃",
        "Each Hindu festival has deep spiritual significance beyond the celebrations! 🎉"
      ],
      science: [
        "Ancient Indian texts described atomic theory thousands of years before modern science! ⚛️",
        "The concept of infinity (♾️) was first mathematically described in ancient Indian texts!",
        "Ayurveda identified the connection between mind and body health 5,000 years ago! 🌿",
        "Ancient Indian astronomers calculated planetary movements with remarkable accuracy! 🌌"
      ],
      culture: [
        'The greeting "Namaste" is a complete philosophy of respect and recognition of divinity in others! 🙏',
        "Indian classical music is based on ragas that are designed to evoke specific emotions and spiritual states! 🎶",
        'The concept of "Seva" (selfless service) is considered one of the highest spiritual practices! 🤲',
        "Traditional Indian art and architecture incorporate sacred geometry and spiritual symbolism! 🏛️"
      ]
    };
    const templates = factTemplates[category] || factTemplates.hinduism;
    return templates[index % templates.length];
  }
  getRandomFact(intent, persona) {
    let relevantFacts = this.facts;
    if (intent) {
      relevantFacts = relevantFacts.filter(
        (fact) => fact.intent.includes(intent) || fact.intent.includes("general_question")
      );
    }
    if (persona) {
      relevantFacts = relevantFacts.filter(
        (fact) => fact.persona.includes(persona) || fact.persona.includes("general_visitor")
      );
    }
    if (relevantFacts.length === 0) {
      relevantFacts = this.facts;
    }
    const randomIndex = Math.floor(Math.random() * relevantFacts.length);
    return relevantFacts[randomIndex].content;
  }
  getFactsByCategory(category) {
    return this.facts.filter((fact) => fact.category === category).map((fact) => fact.content);
  }
  getAllCategories() {
    const categories = new Set(this.facts.map((fact) => fact.category));
    return Array.from(categories);
  }
  getFactsCount() {
    return this.facts.length;
  }
  searchFacts(query, maxResults = 5) {
    const queryWords = query.toLowerCase().split(" ");
    const results = [];
    this.facts.forEach((fact) => {
      let relevanceScore = 0;
      const factContent = fact.content.toLowerCase();
      queryWords.forEach((word) => {
        if (word.length > 2) {
          if (factContent.includes(word)) {
            relevanceScore += word.length > 5 ? 3 : 2;
          }
          if (fact.category.toLowerCase().includes(word)) {
            relevanceScore += 4;
          }
        }
      });
      if (query.toLowerCase().includes(fact.category)) {
        relevanceScore += 5;
      }
      queryWords.forEach((word) => {
        fact.intent.forEach((intent) => {
          if (intent.includes(word)) relevanceScore += 2;
        });
        fact.persona.forEach((persona) => {
          if (persona.includes(word)) relevanceScore += 1;
        });
      });
      if (relevanceScore > 0) {
        results.push({
          content: fact.content,
          category: fact.category,
          relevanceScore
        });
      }
    });
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, maxResults);
  }
  getFactsByQuery(query) {
    const searchResults = this.searchFacts(query, 3);
    return searchResults.map((result) => result.content);
  }
  getRandomFactsByCategory(category, count = 3) {
    const categoryFacts = this.facts.filter((fact) => fact.category === category);
    const shuffled = categoryFacts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map((fact) => fact.content);
  }
}
class ResponseGenerator {
  constructor() {
    this.responseTemplates = {
      greeting: {
        student: [
          "🙏 Namaste! Welcome back to your learning journey! How can I help you today?",
          "Hello there! Ready to explore some amazing Vedic wisdom? What would you like to know?",
          "Hi! Great to see you here. I'm excited to help you with your learning adventure! ✨"
        ],
        parent: [
          "🙏 Namaste! I'm here to help you find the perfect learning experience for your child. What can I assist you with?",
          "Hello! I'd be happy to help you explore our age-appropriate courses and answer any questions about your child's learning journey.",
          "Hi there! As a parent, you want the best education for your child. Let me help you discover our wonderful courses! 👨‍👩‍👧‍👦"
        ],
        prospective_student: [
          "🙏 Welcome to eYogi Gurukul! I'm excited to help you discover the perfect course for your learning journey. What interests you most?",
          "Hello! Ready to explore ancient wisdom through modern learning? I'm here to guide you through our amazing course offerings! ✨",
          "Hi! Welcome to our community of learners. Let me help you find the perfect Gurukul and course for your interests! 🌟"
        ],
        general_visitor: [
          "🙏 Namaste! Welcome to eYogi Gurukul. I'm here to answer any questions about our platform, courses, or Vedic education. How can I help?",
          "Hello! Thanks for visiting eYogi Gurukul. I'd love to help you learn more about our unique approach to ancient wisdom education!",
          "Hi there! Curious about Vedic learning? I'm here to share information about our courses, Gurukuls, and educational philosophy! 🕉️"
        ]
      },
      did_you_know: {
        student: [
          "🌟 I love sharing fascinating knowledge! Here are some amazing facts that will expand your understanding:",
          "✨ Ready for some mind-blowing wisdom? Let me share some incredible facts with you:",
          "🧠 Time for some knowledge expansion! Here are some fascinating discoveries:"
        ],
        parent: [
          "📚 I'd be delighted to share some educational facts that you and your child might find interesting:",
          "🌟 Here are some wonderful facts about Vedic wisdom that make great conversation starters with children:",
          "✨ Let me share some amazing knowledge that showcases the depth of our educational content:"
        ],
        prospective_student: [
          "🎓 Here are some incredible facts that showcase the depth and richness of what you'll learn with us:",
          "🌟 Let me share some fascinating knowledge that demonstrates the value of Vedic education:",
          "✨ Ready to be amazed? Here are some mind-expanding facts about ancient wisdom:"
        ],
        general_visitor: [
          "🕉️ I'd love to share some fascinating facts about Vedic wisdom and ancient knowledge:",
          "🌟 Here are some incredible discoveries that showcase the depth of ancient Indian knowledge:",
          "✨ Let me share some amazing facts that will give you a taste of what we teach:"
        ]
      },
      course_inquiry: {
        student: [
          "Great question about our courses! Based on your profile, here are some perfect matches for you:",
          "I'd love to help you find the ideal course! Let me share some options that align with your learning level:",
          "Excellent! Let me guide you through our course offerings that would be perfect for your learning journey:"
        ],
        parent: [
          "I understand you want the best learning experience for your child. Here are age-appropriate courses I recommend:",
          "As a parent, you'll appreciate our carefully designed age-specific curriculum. Let me show you suitable options:",
          "Perfect! I can help you find courses that are both educational and engaging for your child's age group:"
        ],
        prospective_student: [
          "Wonderful! I'm excited to introduce you to our comprehensive course catalog. Here's what we offer:",
          "Great interest in learning! Let me share our amazing course options that could be perfect for you:",
          "Fantastic! Our courses are designed for learners of all backgrounds. Here are some excellent starting points:"
        ]
      },
      enrollment_process: {
        student: [
          "The enrollment process is simple and straightforward! Here's how you can join any course:",
          "Ready to enroll? I'll walk you through the easy steps to start your learning journey:",
          "Enrolling is quick and easy! Let me guide you through the process step by step:"
        ],
        parent: [
          "I'll explain our secure and parent-friendly enrollment process for your child:",
          "As a parent, you'll appreciate our safe and transparent enrollment system. Here's how it works:",
          "Our enrollment process includes special protections for young learners. Let me explain:"
        ],
        prospective_student: [
          "Ready to begin your learning adventure? Here's our simple enrollment process:",
          "I'm excited to help you join our community! The enrollment process is designed to be smooth and welcoming:",
          "Let me walk you through how easy it is to start learning with us:"
        ]
      },
      pricing_fees: {
        student: [
          "Here's our transparent pricing structure designed to make quality education accessible:",
          "Our fees are structured to provide excellent value for authentic Vedic education:",
          "Let me break down our affordable pricing options for you:"
        ],
        parent: [
          "I understand budget is important for families. Here's our fair and transparent pricing:",
          "Our pricing reflects the quality of education while remaining accessible to families:",
          "As a parent, you'll appreciate our value-focused pricing structure:"
        ],
        prospective_student: [
          "Our pricing is designed to make quality Vedic education accessible to everyone:",
          "Here's our investment in your spiritual and educational growth:",
          "Let me share our affordable pricing options that deliver exceptional value:"
        ]
      },
      gurukul_information: {
        student: [
          "Great question about our Gurukuls! Each one offers a unique learning experience:",
          "I'd love to tell you about our specialized Gurukuls and what makes each one special:",
          "Our Gurukuls are designed to provide deep, focused learning in different areas of Vedic knowledge:"
        ],
        parent: [
          "As a parent, you'll appreciate how each Gurukul provides age-appropriate, structured learning:",
          "Our Gurukuls offer safe, educational environments for children to explore ancient wisdom:",
          "Each Gurukul is carefully designed with your child's developmental needs in mind:"
        ],
        prospective_student: [
          "Welcome! Let me introduce you to our amazing Gurukuls and their unique specializations:",
          "Our Gurukul system offers multiple pathways to explore Vedic knowledge:",
          "Each Gurukul provides a comprehensive learning journey in its specialized area:"
        ]
      },
      certificate_info: {
        student: [
          "Certificates are a wonderful way to showcase your learning achievements! Here's what you need to know:",
          "I'm excited to tell you about our beautiful digital certificates and how to earn them:",
          "Your hard work deserves recognition! Let me explain our certificate system:"
        ],
        parent: [
          "Your child's achievements will be properly recognized with our professional certificates:",
          "We provide authentic, verifiable certificates that showcase your child's learning:",
          "Our certificate system ensures your child's educational achievements are properly documented:"
        ],
        prospective_student: [
          "You'll earn beautiful, verifiable certificates upon completing our courses:",
          "Our certificates are more than just documents - they represent authentic learning achievements:",
          "Let me tell you about the valuable certificates you can earn through our programs:"
        ]
      },
      about_eyogi: {
        student: [
          "I'm happy to share the inspiring story behind eYogi Gurukul and our mission:",
          "Let me tell you about the vision that drives our educational platform:",
          "eYogi Gurukul has a beautiful mission that you're now part of as a student:"
        ],
        parent: [
          "As a parent, you'll appreciate the values and mission that guide our educational approach:",
          "Let me share why eYogi Gurukul is the right choice for your child's spiritual education:",
          "Our organization's values align with providing safe, authentic education for children:"
        ],
        prospective_student: [
          "Welcome! Let me share the inspiring vision behind eYogi Gurukul:",
          "I'd love to tell you about our mission and what makes eYogi Gurukul special:",
          "Discover the beautiful philosophy that guides our educational approach:"
        ]
      }
    };
    this.didYouKnowService = new DidYouKnowService();
  }
  generateResponse(context) {
    var _a, _b;
    const { message, persona, intent, searchResults, user } = context;
    if (intent === "did_you_know") {
      return this.generateDidYouKnowResponse(message, persona, user);
    }
    const templates = ((_a = this.responseTemplates[intent]) == null ? void 0 : _a[persona]) || ((_b = this.responseTemplates[intent]) == null ? void 0 : _b["general_visitor"]) || ["I'd be happy to help you with that! Let me provide you with the information you need:"];
    const template = templates[Math.floor(Math.random() * templates.length)];
    let response = template;
    if (searchResults.length > 0) {
      response += "\n\n";
      const topResults = searchResults.slice(0, 3);
      topResults.forEach((result, index) => {
        var _a2, _b2;
        if (index === 0) {
          response += `📚 **${result.title}**
${result.content}

`;
          if (result.type === "course" && ((_a2 = result.metadata) == null ? void 0 : _a2.course)) {
            response += `🔗 [View Course Details](/courses/${result.metadata.course.id})

`;
          } else if (result.type === "gurukul" && ((_b2 = result.metadata) == null ? void 0 : _b2.gurukul)) {
            response += `🔗 [Explore ${result.metadata.gurukul.name}](/gurukuls/${result.metadata.gurukul.slug})

`;
          }
        } else {
          response += `• **${result.title}**: ${this.truncateContent(result.content, 100)}

`;
        }
      });
      response += this.addIntentBasedLinks(intent, persona);
    } else {
      response += this.generateFallbackResponse(intent, persona);
    }
    response = this.addPersonalizedTouches(response, user, persona, intent);
    response += this.generateSuggestions(intent, persona);
    return response.trim();
  }
  generateDidYouKnowResponse(message, persona, user) {
    const templates = this.responseTemplates.did_you_know[persona] || this.responseTemplates.did_you_know["general_visitor"];
    const template = templates[Math.floor(Math.random() * templates.length)];
    let response = template + "\n\n";
    const specificQuery = this.extractSpecificQuery(message);
    if (specificQuery) {
      const searchResults = this.didYouKnowService.searchFacts(specificQuery, 3);
      if (searchResults.length > 0) {
        response += `🎯 **Facts about "${specificQuery}":**

`;
        searchResults.forEach((result, index) => {
          response += `${index + 1}. ${result.content}

`;
        });
      } else {
        const category = this.getCategoryFromQuery(specificQuery);
        const randomFacts = this.didYouKnowService.getRandomFactsByCategory(category, 3);
        response += `🌟 **Here are some amazing facts related to your interest:**

`;
        randomFacts.forEach((fact, index) => {
          response += `${index + 1}. ${fact}

`;
        });
      }
    } else {
      const randomFacts = [
        this.didYouKnowService.getRandomFact(),
        this.didYouKnowService.getRandomFact(),
        this.didYouKnowService.getRandomFact()
      ];
      response += `🎲 **Random Amazing Facts:**

`;
      randomFacts.forEach((fact, index) => {
        response += `${index + 1}. ${fact}

`;
      });
    }
    response += "🔗 **Explore More:**\n";
    response += "• [Browse All Courses](/courses) - Discover courses on these topics\n";
    response += "• [Explore Gurukuls](/gurukuls) - Learn more about our specialized schools\n";
    response += "• [About eYogi](/about) - Understand our educational philosophy\n\n";
    response += "💡 Want to learn more? Ask me about specific topics like 'Sanskrit facts', 'Yoga wisdom', 'Hindu philosophy', or 'Mantra science'!";
    return response;
  }
  extractSpecificQuery(message) {
    const lowerMessage = message.toLowerCase();
    const topics = [
      "sanskrit",
      "yoga",
      "hinduism",
      "hindu",
      "philosophy",
      "mantra",
      "mantras",
      "meditation",
      "dharma",
      "karma",
      "festival",
      "festivals",
      "ayurveda",
      "vedic",
      "vedas",
      "guru",
      "gurukul",
      "om",
      "namaste",
      "chakra",
      "chakras",
      "pranayama",
      "asana",
      "asanas",
      "bhagavad gita",
      "upanishads",
      "ramayana",
      "mahabharata",
      "diwali",
      "holi",
      "navratri",
      "ganesh",
      "shiva",
      "vishnu",
      "brahma",
      "lakshmi",
      "saraswati",
      "hanuman",
      "krishna",
      "rama"
    ];
    for (const topic of topics) {
      if (lowerMessage.includes(topic)) {
        return topic;
      }
    }
    const aboutMatch = lowerMessage.match(/about\s+(\w+)/i);
    if (aboutMatch) {
      return aboutMatch[1];
    }
    const factsMatch = lowerMessage.match(/(\w+)\s+facts?/i);
    if (factsMatch) {
      return factsMatch[1];
    }
    return "";
  }
  getCategoryFromQuery(query) {
    const categoryMap = {
      "sanskrit": "sanskrit",
      "yoga": "yoga",
      "hinduism": "hinduism",
      "hindu": "hinduism",
      "philosophy": "philosophy",
      "mantra": "mantras",
      "mantras": "mantras",
      "meditation": "meditation",
      "festival": "festivals",
      "festivals": "festivals",
      "science": "science",
      "culture": "culture",
      "ayurveda": "science",
      "vedic": "hinduism",
      "vedas": "hinduism"
    };
    return categoryMap[query.toLowerCase()] || "hinduism";
  }
  addIntentBasedLinks(intent, persona) {
    const linkSets = {
      course_inquiry: "\n🔗 **Helpful Links:**\n• [Browse All Courses](/courses)\n• [Explore Gurukuls](/gurukuls)\n• [About Our Education](/about)\n",
      enrollment_process: "\n🔗 **Get Started:**\n• [Create Account](/auth/signup)\n• [Sign In](/auth/signin)\n• [Browse Courses](/courses)\n",
      gurukul_information: "\n🔗 **Explore More:**\n• [All Gurukuls](/gurukuls)\n• [Hinduism Gurukul](/gurukuls/hinduism)\n• [Philosophy Gurukul](/gurukuls/philosophy)\n• [Sanskrit Gurukul](/gurukuls/sanskrit)\n• [Mantra Gurukul](/gurukuls/mantra)\n• [Yoga & Wellness](/gurukuls/yoga-wellness)\n",
      pricing_fees: "\n🔗 **View Details:**\n• [Course Pricing](/courses)\n• [Contact Us](/contact)\n",
      certificate_info: "\n🔗 **Learn More:**\n• [About Certificates](/about)\n• [Student Dashboard](/dashboard/student)\n",
      about_eyogi: "\n🔗 **Discover More:**\n• [About Us](/about)\n• [Contact Us](/contact)\n",
      contact_info: "\n🔗 **Contact Options:**\n• [Contact Form](/contact)\n• [About Us](/about)\n",
      student_progress: "\n🔗 **Your Dashboard:**\n• [Student Dashboard](/dashboard/student)\n• [Browse More Courses](/courses)\n",
      did_you_know: "\n🔗 **Learn More:**\n• [Browse Courses](/courses)\n• [Explore Gurukuls](/gurukuls)\n• [About eYogi](/about)\n"
    };
    return linkSets[intent] || "";
  }
  generateFallbackResponse(intent, persona) {
    const fallbacks = {
      course_inquiry: "\n\nWe offer comprehensive courses across 5 specialized Gurukuls: Hinduism, Mantra, Philosophy, Sanskrit, and Yoga & Wellness. Each Gurukul has courses for different age groups from 4 years to adult learners.\n\n🔗 **Quick Links:**\n• [Browse All Courses](/courses)\n• [Explore Gurukuls](/gurukuls)\n• [About Our Education](/about)",
      enrollment_process: "\n\nTo enroll: 1) Create your account, 2) Browse courses by age/interest, 3) Click 'Enroll Now', 4) Complete payment, 5) Get teacher approval, 6) Start learning!\n\n🔗 **Get Started:**\n• [Create Account](/auth/signup)\n• [Browse Courses](/courses)\n• [Sign In](/auth/signin)",
      gurukul_information: "\n\nOur 5 Gurukuls each specialize in different aspects of Vedic knowledge: Hinduism (traditions & philosophy), Mantra (sacred sounds), Philosophy (ancient wisdom), Sanskrit (sacred language), and Yoga & Wellness (holistic health).",
      pricing_fees: "\n\nOur courses range from €35-€100 depending on level and duration. Elementary (€35-40), Basic (€50-60), Intermediate (€75-85), Advanced (€100+). We offer family discounts and early bird pricing!\n\n🔗 **View Pricing:**\n• [See All Course Prices](/courses)\n• [Contact for Discounts](/contact)",
      certificate_info: "\n\nAll students receive beautiful digital certificates upon course completion. Certificates include verification codes, can be downloaded as PDF, shared on social media, and are recognized for their authentic Vedic education content.",
      contact_info: "\n\nYou can reach us at info@eyogigurukul.com, call +353 1 234 5678 (Mon-Fri 9AM-6PM IST), or use this chat for immediate assistance. We're based in Dublin, Ireland but serve students globally!\n\n🔗 **Contact Options:**\n• [Contact Form](/contact)\n• [About Us](/about)",
      about_eyogi: "\n\neYogi Gurukul bridges ancient Vedic wisdom with modern learning technology. We create 'eYogis' - practitioners who connect spiritual science with contemporary life, building peace and harmony while respecting all cultures.",
      did_you_know: "\n\nI have access to over 1000 fascinating facts about Vedic wisdom, ancient knowledge, and spiritual practices! You can ask me for facts about specific topics like 'Sanskrit facts', 'Yoga wisdom', 'Hindu traditions', 'Philosophy insights', or just say 'surprise me with a fact'!",
      technical_support: "\n\nFor technical issues: try refreshing your browser, check your internet connection, or clear your browser cache. For persistent problems, contact support@eyogigurukul.com with details about your issue."
    };
    return fallbacks[intent] || "\n\nI'm here to help with any questions about eYogi Gurukul, our courses, enrollment, or Vedic education in general!";
  }
  addPersonalizedTouches(response, user, persona, intent) {
    var _a;
    if (user) {
      const firstName = ((_a = user.full_name) == null ? void 0 : _a.split(" ")[0]) || "friend";
      if (intent === "student_progress" && user.role === "student") {
        response += `

🎯 ${firstName}, you can check your detailed progress in your student dashboard where you'll find all your enrolled courses, completion status, and certificates!`;
      }
      if (intent === "course_inquiry" && user.age) {
        const ageGroup = this.getAgeGroupForAge(user.age);
        response += `

💡 Based on your age (${user.age}), I recommend looking at our ${ageGroup} level courses which are perfectly designed for your learning stage!`;
      }
    }
    if (persona === "parent") {
      response += `

👨‍👩‍👧‍👦 As a parent, you'll be pleased to know that all our courses include progress reports and we maintain open communication about your child's learning journey.`;
    }
    return response;
  }
  generateSuggestions(intent, persona) {
    const suggestions = {
      course_inquiry: [
        "Would you like me to recommend courses based on a specific age group?",
        "Are you interested in a particular Gurukul or subject area?",
        "Would you like to know about course schedules and duration?",
        "Shall I help you find courses that match your learning level?"
      ],
      enrollment_process: [
        "Would you like me to guide you through creating an account?",
        "Do you have questions about payment options?",
        "Would you like to know about our approval process?",
        "Need help understanding the enrollment timeline?"
      ],
      pricing_fees: [
        "Would you like information about family discounts?",
        "Are you interested in our early bird pricing?",
        "Do you need details about payment plans?",
        "Shall I explain our refund policy?"
      ],
      gurukul_information: [
        "Would you like to explore a specific Gurukul in detail?",
        "Are you interested in the teaching methodology?",
        "Would you like to know about our teachers and their qualifications?",
        "Shall I help you choose the right Gurukul for your interests?"
      ],
      certificate_info: [
        "Would you like to see examples of our certificates?",
        "Are you interested in the verification process?",
        "Shall I explain how to share your certificates professionally?"
      ],
      did_you_know: [
        "Would you like to learn about a specific topic like Sanskrit, Yoga, or Hindu philosophy?",
        "Are you interested in facts about festivals, mantras, or ancient science?",
        "Shall I share more wisdom about meditation, dharma, or spiritual practices?",
        "Would you like to explore facts about specific Gurukuls or courses?"
      ],
      about_eyogi: [
        "Would you like to know more about our teaching philosophy?",
        "Are you interested in our global community of learners?",
        "Shall I tell you about our founders and team?"
      ]
    };
    const intentSuggestions = suggestions[intent];
    if (intentSuggestions && intentSuggestions.length > 0) {
      const randomSuggestion = intentSuggestions[Math.floor(Math.random() * intentSuggestions.length)];
      return `

❓ ${randomSuggestion}`;
    }
    return "\n\n💬 Feel free to ask me anything else about eYogi Gurukul!";
  }
  truncateContent(content, maxLength) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  }
  getAgeGroupForAge(age) {
    if (age >= 4 && age <= 7) return "Elementary";
    if (age >= 8 && age <= 11) return "Basic";
    if (age >= 12 && age <= 15) return "Intermediate";
    if (age >= 16 && age <= 19) return "Advanced";
    return "Adult Learning";
  }
}
class ChatService {
  constructor() {
    this.conversationHistory = [];
    this.personaDetector = new PersonaDetector();
    this.intentClassifier = new IntentClassifier();
    this.semanticSearch = new SemanticSearch();
    this.didYouKnowService = new DidYouKnowService();
    this.responseGenerator = new ResponseGenerator();
  }
  async processMessage(message, user) {
    try {
      const persona = this.personaDetector.detectPersona(message, user);
      const intentResult = this.intentClassifier.classifyIntent(message, persona);
      const searchResults = await this.semanticSearch.search(message, intentResult.intent, persona);
      const response = this.responseGenerator.generateResponse({
        message,
        persona,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        searchResults,
        user,
        conversationHistory: this.conversationHistory
      });
      const didYouKnow = Math.random() < 0.3 ? this.didYouKnowService.getRandomFact(intentResult.intent, persona) : void 0;
      this.conversationHistory.push({
        user: message,
        bot: response,
        timestamp: /* @__PURE__ */ new Date()
      });
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }
      return {
        message: response,
        persona,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        didYouKnow
      };
    } catch (error) {
      console.error("Error in ChatService:", error);
      throw error;
    }
  }
  getConversationHistory() {
    return this.conversationHistory;
  }
  clearHistory() {
    this.conversationHistory = [];
  }
}
function ChatBot({ isOpen, onClose, initialMessage }) {
  const { user } = useAuth();
  const [messages, setMessages] = reactExports.useState([]);
  const [inputMessage, setInputMessage] = reactExports.useState("");
  const [isTyping, setIsTyping] = reactExports.useState(false);
  const [isListening, setIsListening] = reactExports.useState(false);
  const [chatService] = reactExports.useState(() => new ChatService());
  const messagesEndRef = reactExports.useRef(null);
  const inputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    var _a;
    if (isOpen) {
      const welcomeMessage = {
        id: "welcome",
        type: "bot",
        content: `🙏 Namaste ${((_a = user == null ? void 0 : user.email) == null ? void 0 : _a.split("@")[0]) || "friend"}! I'm your eYogi AI assistant. I'm here to help you with questions about our courses, Gurukuls, enrollment, and anything related to your learning journey. How can I assist you today?`,
        timestamp: /* @__PURE__ */ new Date(),
        persona: "student",
        intent: "greeting"
      };
      setMessages([welcomeMessage]);
      setTimeout(() => {
        var _a2;
        return (_a2 = inputRef.current) == null ? void 0 : _a2.focus({ preventScroll: true });
      }, 100);
    }
  }, [isOpen, user]);
  reactExports.useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.target && e.target.closest('[data-chatbot="true"]')) {
          return;
        }
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) {
          e.preventDefault();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);
  reactExports.useEffect(() => {
    if (initialMessage && isOpen) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, isOpen]);
  reactExports.useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const scrollToBottom = () => {
    var _a;
    (_a = messagesEndRef.current) == null ? void 0 : _a.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest"
    });
  };
  const handleSendMessage = async (message) => {
    var _a;
    const messageText = message || inputMessage.trim();
    if (!messageText) return;
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: messageText,
      timestamp: /* @__PURE__ */ new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setTimeout(() => {
      var _a2;
      (_a2 = inputRef.current) == null ? void 0 : _a2.focus({ preventScroll: true });
    }, 0);
    try {
      const localUser = user ? {
        id: user.id,
        email: user.email || "",
        full_name: ((_a = user.email) == null ? void 0 : _a.split("@")[0]) || "",
        role: "admin",
        student_id: "",
        age: void 0,
        created_at: user.created_at,
        updated_at: user.updated_at || ""
      } : null;
      const response = await chatService.processMessage(messageText, localUser);
      await new Promise((resolve) => setTimeout(resolve, 1e3 + Math.random() * 1e3));
      const botMessage = {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: response.message,
        timestamp: /* @__PURE__ */ new Date(),
        persona: response.persona,
        intent: response.intent,
        confidence: response.confidence,
        didYouKnow: response.didYouKnow
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: "bot",
        content: "I apologize, but I encountered an error processing your message. Please try again or contact our support team for assistance.",
        timestamp: /* @__PURE__ */ new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };
  const handleVoiceInput = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SpeechRecognition) return;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onstart = () => {
        setIsListening(true);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  };
  const clearChat = () => {
    setMessages([]);
    const welcomeMessage = {
      id: "welcome-new",
      type: "bot",
      content: `🙏 Chat cleared! I'm ready to help you with any questions about eYogi Gurukul. What would you like to know?`,
      timestamp: /* @__PURE__ */ new Date()
    };
    setMessages([welcomeMessage]);
  };
  const quickQuestions = [
    "What courses are available for my age?",
    "How do I enroll in a course?",
    "What is the fee structure?",
    "Tell me about Hinduism Gurukul",
    "How do I get certificates?",
    "What are the different Gurukuls?",
    "Tell me an interesting fact",
    "Share some Sanskrit wisdom"
  ];
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed z-50 animate-in slide-in-from-bottom-4 slide-in-from-right-4 duration-300 \r\n                 md:bottom-6 md:right-6 md:w-96 md:h-[600px] md:top-auto md:left-auto\r\n                 top-16 bottom-4 left-4 right-4\r\n                 sm:top-20\r\n                 chatbot-container",
      onClick: (e) => e.stopPropagation(),
      "data-chatbot": "true",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full h-full flex flex-col shadow-2xl border border-gray-700 bg-gray-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg px-3 sm:px-6 py-3 sm:py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 sm:space-x-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-4 w-4 sm:h-6 sm:w-6 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base sm:text-lg font-bold", children: "eYogi AI Assistant" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-orange-100 text-xs sm:text-sm hidden sm:block", children: "Your personal learning companion" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-orange-100 text-xs sm:hidden", children: "Learning companion" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-1 sm:space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: clearChat,
                className: "text-white hover:bg-white/10 p-2 sm:p-2 min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px]",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$1, { className: "h-4 w-4 sm:h-4 sm:w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: onClose,
                className: "text-white hover:bg-white/10 p-2 sm:p-2 min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px]",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "h-5 w-5 sm:h-5 sm:w-5" })
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-800", children: [
          messages.map((message) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `flex ${message.type === "user" ? "justify-end" : "justify-start"}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `max-w-[90%] sm:max-w-[85%] ${message.type === "user" ? "order-2" : "order-1"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        className: `flex items-start space-x-2 sm:space-x-3 ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`,
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: `h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === "user" ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gradient-to-r from-orange-500 to-red-500"}`,
                              children: message.type === "user" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$3, { className: "h-3 w-3 sm:h-4 sm:w-4 text-white" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-3 w-3 sm:h-4 sm:w-4 text-white" })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "div",
                            {
                              className: `rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${message.type === "user" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "bg-gray-700 text-gray-100"}`,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm sm:text-sm leading-relaxed whitespace-pre-wrap", children: message.type === "bot" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "div",
                                  {
                                    dangerouslySetInnerHTML: {
                                      __html: message.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(
                                        /\[([^\]]+)\]\(([^)]+)\)/g,
                                        '<a href="$2" class="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>'
                                      ).replace(/\n/g, "<br>")
                                    }
                                  }
                                ) : message.content }),
                                message.type === "bot" && (message.persona || message.intent) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 pt-2 border-t border-gray-600 flex items-center space-x-2", children: [
                                  message.persona && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "info", className: "text-xs", children: message.persona }),
                                  message.intent && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", className: "text-xs", children: message.intent }),
                                  message.confidence && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
                                    Math.round(message.confidence * 100),
                                    "% confident"
                                  ] })
                                ] }),
                                message.didYouKnow && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-600", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "h-4 w-4 text-purple-400" }),
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-purple-300", children: "Did You Know?" })
                                  ] }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-purple-200", children: message.didYouKnow })
                                ] })
                              ]
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: `mt-1 text-xs text-gray-400 ${message.type === "user" ? "text-right" : "text-left"}`,
                        children: formatDateTime(message.timestamp)
                      }
                    )
                  ]
                }
              )
            },
            message.id
          )),
          isTyping && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-4 w-4 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gray-700 rounded-2xl px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex space-x-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce",
                  style: { animationDelay: "0.1s" }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce",
                  style: { animationDelay: "0.2s" }
                }
              )
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: messagesEndRef })
        ] }),
        messages.length <= 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 sm:px-4 pb-2 sm:pb-4 bg-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 sm:mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs sm:text-sm font-semibold text-gray-200 mb-2 sm:mb-3 flex items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" }),
            "Quick Questions"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-1.5 sm:gap-2", children: quickQuestions.slice(0, 4).map((question, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleSendMessage(question),
              className: "text-left p-2.5 sm:p-2 text-xs sm:text-xs bg-gray-700 hover:bg-orange-900/30 hover:text-orange-300 text-gray-200 rounded-lg transition-colors border border-gray-600 hover:border-orange-500 min-h-[40px] sm:min-h-[36px] flex items-center",
              children: question
            },
            index
          )) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 sm:p-4 border-t border-gray-600 bg-gray-900 rounded-b-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "form",
            {
              onSubmit: (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSendMessage();
              },
              className: "flex items-center space-x-2 sm:space-x-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      ref: inputRef,
                      type: "text",
                      value: inputMessage,
                      onChange: (e) => setInputMessage(e.target.value),
                      onKeyPress: handleKeyPress,
                      placeholder: "Ask me anything about eYogi Gurukul...",
                      className: "w-full px-3 sm:px-4 py-3 pr-10 sm:pr-12 border border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm min-h-[48px]",
                      disabled: isTyping,
                      style: { fontSize: "16px" }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: handleVoiceInput,
                      className: `absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-1 rounded-full transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${isListening ? "text-red-400 bg-red-900/30" : "text-gray-400 hover:text-orange-400 hover:bg-orange-900/30"}`,
                      children: isListening ? /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$6, { className: "h-3 w-3 sm:h-4 sm:w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$7, { className: "h-3 w-3 sm:h-4 sm:w-4" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    onClick: () => handleSendMessage(),
                    disabled: !inputMessage.trim() || isTyping,
                    className: "px-3 sm:px-4 py-3 min-h-[48px] min-w-[48px]",
                    type: "submit",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$8, { className: "h-4 w-4" })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400 space-y-1 sm:space-y-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-center sm:text-left", children: "Press Enter to send • Shift+Enter for new line" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center justify-center sm:justify-end space-x-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$9, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "AI-powered by eYogi" })
            ] })
          ] })
        ] })
      ] })
    }
  );
}
function ChatBotTrigger({ className, initialMessage }) {
  const [isOpen, setIsOpen] = reactExports.useState(false);
  const [isHovered, setIsHovered] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    !isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `fixed bottom-6 right-6 z-40 
                         sm:bottom-4 sm:right-4
                         xs:bottom-3 xs:right-3 ${className}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-ping opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setIsOpen(true),
              onMouseEnter: () => setIsHovered(true),
              onMouseLeave: () => setIsHovered(false),
              className: "relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group\r\n                         sm:p-3 xs:p-3\r\n                         min-h-touch min-w-touch\r\n                         flex items-center justify-center",
              style: { minHeight: "44px", minWidth: "44px" },
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-6 w-6 sm:h-5 sm:w-5 xs:h-5 xs:w-5 flex-shrink-0" }),
                isHovered && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium whitespace-nowrap hidden sm:block", children: "Ask eYogi AI" })
              ] })
            }
          ),
          !isHovered && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden sm:block", children: [
            "Ask me anything about eYogi Gurukul!",
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChatBot, { isOpen, onClose: () => setIsOpen(false), initialMessage })
  ] });
}
function StudentDashboard() {
  var _a, _b;
  const { user } = useWebsiteAuth();
  const [activeTab, setActiveTab] = reactExports.useState(
    "home"
  );
  const [sidebarOpen, setSidebarOpen] = reactExports.useState(true);
  const [enrollments, setEnrollments] = reactExports.useState([]);
  const [certificates, setCertificates] = reactExports.useState([]);
  const [availableCourses, setAvailableCourses] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [stats, setStats] = reactExports.useState({
    totalEnrollments: 0,
    completedCourses: 0,
    activeCourses: 0,
    certificatesEarned: 0,
    totalSpent: 0,
    averageGrade: 0,
    learningStreak: 7,
    xpPoints: 1250,
    level: "Intermediate",
    completionRate: 0
  });
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [gurukulFilter, setGurukulFilter] = reactExports.useState("all");
  reactExports.useEffect(() => {
    if (user == null ? void 0 : user.id) {
      loadStudentData();
    }
  }, [user == null ? void 0 : user.id]);
  const loadStudentData = async () => {
    try {
      const [enrollmentsData, certificatesData, coursesData] = await Promise.all([
        getStudentEnrollments(user.id),
        getStudentCertificates(user.id),
        getCourses()
      ]);
      setEnrollments(enrollmentsData);
      const mappedCertificates = certificatesData.map((cert) => ({
        ...cert,
        issue_date: cert.issued_at
      }));
      setCertificates(mappedCertificates);
      setAvailableCourses(coursesData);
      const completedCount = enrollmentsData.filter((e) => e.status === "completed").length;
      const activeCount = enrollmentsData.filter((e) => e.status === "approved").length;
      const totalSpent = enrollmentsData.reduce((sum, e) => {
        var _a2;
        return sum + (((_a2 = e.course) == null ? void 0 : _a2.price) || 0);
      }, 0);
      const completionRate = enrollmentsData.length > 0 ? completedCount / enrollmentsData.length * 100 : 0;
      setStats({
        totalEnrollments: enrollmentsData.length,
        completedCourses: completedCount,
        activeCourses: activeCount,
        certificatesEarned: certificatesData.length,
        totalSpent,
        averageGrade: 85,
        learningStreak: 7,
        xpPoints: 1250 + completedCount * 100,
        level: completedCount < 3 ? "Beginner" : completedCount < 8 ? "Intermediate" : "Advanced",
        completionRate
      });
    } catch (error) {
      console.error("Error loading student data:", error);
      zt.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };
  const tabs = [
    {
      id: "home",
      name: "Home",
      icon: ForwardRef$a,
      description: "Your Learning Hub",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      id: "courses",
      name: "My Courses",
      icon: ForwardRef$b,
      description: "Learning Journey",
      gradient: "from-green-500 to-teal-600",
      badge: stats.activeCourses > 0 ? stats.activeCourses : void 0
    },
    {
      id: "certificates",
      name: "Achievements",
      icon: ForwardRef$c,
      description: "Your Success Story",
      gradient: "from-yellow-500 to-orange-600",
      badge: stats.certificatesEarned > 0 ? stats.certificatesEarned : void 0
    },
    {
      id: "profile",
      name: "Profile",
      icon: ForwardRef$3,
      description: "Personal Settings",
      gradient: "from-pink-500 to-rose-600"
    }
  ];
  const getXPForNextLevel = () => {
    const currentLevel = stats.level;
    const xpThresholds = { Intermediate: 2500, Advanced: 5e3 };
    if (currentLevel === "Beginner") return xpThresholds.Intermediate;
    if (currentLevel === "Intermediate") return xpThresholds.Advanced;
    return xpThresholds.Advanced;
  };
  const getProgressToNextLevel = () => {
    const nextLevelXP = getXPForNextLevel();
    return stats.xpPoints / nextLevelXP * 100;
  };
  const filteredEnrollments = enrollments.filter((enrollment) => {
    var _a2, _b2, _c, _d, _e;
    const matchesSearch = ((_b2 = (_a2 = enrollment.course) == null ? void 0 : _a2.title) == null ? void 0 : _b2.toLowerCase().includes(searchTerm.toLowerCase())) || ((_d = (_c = enrollment.course) == null ? void 0 : _c.course_number) == null ? void 0 : _d.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || enrollment.status === statusFilter;
    const matchesGurukul = gurukulFilter === "all" || ((_e = enrollment.course) == null ? void 0 : _e.gurukul_id) === gurukulFilter;
    return matchesSearch && matchesStatus && matchesGurukul;
  });
  const activeCourses = enrollments.filter((e) => e.status === "approved");
  const recentCertificates = certificates.slice(0, 3);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-16 lg:pt-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-lg", children: "Loading your learning dashboard..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 lg:pt-20", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `${sidebarOpen ? "w-80" : "w-20"} bg-white shadow-xl transition-all duration-300 flex flex-col relative z-30 min-h-screen`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-lg", children: ((_a = user == null ? void 0 : user.full_name) == null ? void 0 : _a.charAt(0)) || "S" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold text-lg", children: "Welcome back!" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-orange-100 text-sm", children: (user == null ? void 0 : user.full_name) || "Student" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-orange-200 text-xs", children: [
                      "ID: ",
                      user == null ? void 0 : user.student_id
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => setSidebarOpen(!sidebarOpen),
                    className: "p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors",
                    children: sidebarOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$d, { className: "h-5 w-5" })
                  }
                )
              ] }),
              sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/10 rounded-lg p-3 backdrop-blur-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium", children: [
                      "Level: ",
                      stats.level
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
                      stats.xpPoints,
                      " XP"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-white/20 rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "bg-white rounded-full h-2 transition-all duration-500",
                      style: { width: `${Math.min(getProgressToNextLevel(), 100)}%` }
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-orange-100 mt-1", children: [
                    getXPForNextLevel() - stats.xpPoints,
                    " XP to next level"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/10 rounded-lg p-2 text-center backdrop-blur-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$e, { className: "h-5 w-5 mx-auto mb-1 text-orange-200" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: stats.learningStreak }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-orange-100", children: "Day Streak" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/10 rounded-lg p-2 text-center backdrop-blur-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-5 w-5 mx-auto mb-1 text-orange-200" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: stats.certificatesEarned }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-orange-100", children: "Certificates" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/10 rounded-lg p-2 text-center backdrop-blur-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$f, { className: "h-5 w-5 mx-auto mb-1 text-orange-200" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-lg font-bold", children: [
                      Math.round(stats.completionRate),
                      "%"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-orange-100", children: "Complete" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 p-4 space-y-2", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setActiveTab(tab.id),
                className: `w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${activeTab === tab.id ? "bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 shadow-md transform scale-105" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:transform hover:scale-102"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: `p-2 rounded-lg ${activeTab === tab.id ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`,
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { className: "h-5 w-5" })
                      }
                    ),
                    tab.badge && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center", children: tab.badge > 9 ? "9+" : tab.badge })
                  ] }),
                  sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: tab.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs opacity-75", children: tab.description })
                  ] })
                ]
              },
              tab.id
            )) }),
            sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border-t border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-5 w-5 text-purple-600" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-purple-900", children: "Learning Tip" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-purple-700", children: "Complete courses to earn XP and unlock new achievements! 🌟" })
            ] }) })
          ]
        }
      ),
      sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden",
          onClick: () => setSidebarOpen(false)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setSidebarOpen(true),
              className: "p-2 rounded-lg hover:bg-gray-100",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$d, { className: "h-6 w-6 text-gray-600" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-bold text-gray-900", children: "Student Dashboard" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10" }),
          " "
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-y-auto p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto", children: [
          activeTab === "home" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center space-x-2 mb-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent", children: [
                  "Welcome back, ",
                  ((_b = user == null ? void 0 : user.full_name) == null ? void 0 : _b.split(" ")[0]) || "Student",
                  "!"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$g, { className: "h-8 w-8 text-red-500 animate-pulse" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600", children: "Ready to continue your amazing learning journey? ✨" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl card-hover transform hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-center text-white", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$b, { className: "h-12 w-12 mx-auto mb-3 text-blue-100" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold mb-1 text-white", children: stats.activeCourses }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-blue-100", children: "Active Courses" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-blue-200 mt-2", children: "Keep learning! 📚" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative overflow-hidden rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-xl card-hover transform hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-center text-white", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$h, { className: "h-12 w-12 mx-auto mb-3 text-green-100" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold mb-1 text-white", children: stats.completedCourses }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-green-100", children: "Completed" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-green-200 mt-2", children: "Amazing progress! 🎉" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl card-hover transform hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-center text-white", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-12 w-12 mx-auto mb-3 text-purple-100" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold mb-1 text-white", children: stats.certificatesEarned }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-purple-100", children: "Certificates" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-purple-200 mt-2", children: "You're a star! ⭐" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-xl card-hover transform hover:scale-105", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-center text-white", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$e, { className: "h-12 w-12 mx-auto mb-3 text-orange-100" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold mb-1 text-white", children: stats.learningStreak }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-orange-100", children: "Day Streak" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-orange-200 mt-2", children: "You're on fire! 🔥" })
              ] }) })
            ] }),
            activeCourses.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3 mb-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$i, { className: "h-6 w-6 text-orange-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Continue Learning" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: activeCourses.slice(0, 3).map((enrollment) => {
                var _a2, _b2, _c, _d, _e;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Card,
                  {
                    className: "card-hover overflow-hidden border-2 border-transparent hover:border-orange-200",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-gradient-to-r from-orange-500 to-red-500" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Badge,
                            {
                              className: getLevelColor(((_a2 = enrollment.course) == null ? void 0 : _a2.level) || "basic"),
                              children: (_b2 = enrollment.course) == null ? void 0 : _b2.level
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500", children: (_c = enrollment.course) == null ? void 0 : _c.course_number })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2 line-clamp-2", children: (_d = enrollment.course) == null ? void 0 : _d.title }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm mb-4 line-clamp-2", children: (_e = enrollment.course) == null ? void 0 : _e.description }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Progress" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-orange-600", children: "65%" })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              className: "bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full",
                              style: { width: "65%" }
                            }
                          ) })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex space-x-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "flex-1", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$j, { className: "h-4 w-4 mr-2" }),
                            "Continue"
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$k, { className: "h-4 w-4" }) })
                        ] })
                      ] })
                    ]
                  },
                  enrollment.id
                );
              }) })
            ] }),
            recentCertificates.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3 mb-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$l, { className: "h-6 w-6 text-purple-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Recent Achievements" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-3 gap-6", children: recentCertificates.map((certificate) => {
                var _a2;
                return /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Card,
                  {
                    className: "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 card-hover",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-12 w-12 text-yellow-500 mx-auto mb-3" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-gray-900 mb-2", children: (_a2 = certificate.course) == null ? void 0 : _a2.title }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 mb-3", children: [
                        "Completed ",
                        formatDate(certificate.issue_date)
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex space-x-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "flex-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$m, { className: "h-4 w-4 mr-1" }),
                          "Download"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$n, { className: "h-4 w-4" }) })
                      ] })
                    ] })
                  },
                  certificate.id
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3 mb-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$o, { className: "h-6 w-6 text-blue-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Recommended for You" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: availableCourses.slice(0, 3).map((course) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                Card,
                {
                  className: "card-hover border-2 border-transparent hover:border-blue-200",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: getLevelColor(course.level), children: course.level }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500", children: course.course_number })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2 line-clamp-2", children: course.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm mb-4 line-clamp-2", children: course.description }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm text-gray-500 mb-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        course.duration_weeks,
                        " weeks"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCurrency(course.price) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/courses/${course.id}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "w-full", children: [
                      "Learn More",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$p, { className: "h-4 w-4 ml-2" })
                    ] }) })
                  ] })
                },
                course.id
              )) })
            ] })
          ] }),
          activeTab === "courses" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "My Learning Journey" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$q, { className: "h-4 w-4 mr-2" }),
                "Explore More Courses"
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$r, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Search courses...",
                    value: searchTerm,
                    onChange: (e) => setSearchTerm(e.target.value),
                    className: "pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: statusFilter,
                  onChange: (e) => setStatusFilter(e.target.value),
                  className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Status" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending", children: "Pending" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "approved", children: "Active" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "completed", children: "Completed" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rejected", children: "Rejected" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: gurukulFilter,
                  onChange: (e) => setGurukulFilter(e.target.value),
                  className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Gurukuls" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "gurukul-1", children: "Hinduism Gurukul" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "gurukul-2", children: "Mantra Gurukul" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "gurukul-3", children: "Philosophy Gurukul" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "gurukul-4", children: "Sanskrit Gurukul" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "gurukul-5", children: "Yoga & Wellness" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setGurukulFilter("all");
                  },
                  children: "Clear Filters"
                }
              )
            ] }) }) }),
            filteredEnrollments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "text-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$b, { className: "h-16 w-16 text-gray-300 mx-auto mb-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "No courses found" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-6", children: enrollments.length === 0 ? "You haven't enrolled in any courses yet. Start your learning journey today!" : "No courses match your current filters." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-4 w-4 mr-2" }),
                "Discover Courses"
              ] }) })
            ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredEnrollments.map((enrollment) => {
              var _a2, _b2, _c, _d, _e, _f, _g, _h;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-hover overflow-hidden", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `h-2 ${enrollment.status === "completed" ? "bg-gradient-to-r from-green-500 to-emerald-500" : enrollment.status === "approved" ? "bg-gradient-to-r from-blue-500 to-indigo-500" : enrollment.status === "pending" ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-gray-400 to-gray-500"}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Badge,
                      {
                        className: getLevelColor(((_a2 = enrollment.course) == null ? void 0 : _a2.level) || "basic"),
                        children: (_b2 = enrollment.course) == null ? void 0 : _b2.level
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Badge,
                      {
                        className: enrollment.status === "completed" ? "bg-green-100 text-green-800" : enrollment.status === "approved" ? "bg-blue-100 text-blue-800" : enrollment.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800",
                        children: enrollment.status
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2 line-clamp-2", children: (_c = enrollment.course) == null ? void 0 : _c.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm mb-4 line-clamp-2", children: (_d = enrollment.course) == null ? void 0 : _d.description }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mb-4 text-sm text-gray-500", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Gurukul:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: (_f = (_e = enrollment.course) == null ? void 0 : _e.gurukul) == null ? void 0 : _f.name })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Duration:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
                        (_g = enrollment.course) == null ? void 0 : _g.duration_weeks,
                        " weeks"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Enrolled:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: formatDate(enrollment.enrolled_at) })
                    ] })
                  ] }),
                  enrollment.status === "approved" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm mb-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Progress" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-orange-600", children: "65%" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full",
                        style: { width: "65%" }
                      }
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex space-x-2", children: [
                    enrollment.status === "approved" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$j, { className: "h-4 w-4 mr-1" }),
                      "Continue"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/courses/${(_h = enrollment.course) == null ? void 0 : _h.id}`, className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "w-full", children: "View Details" }) })
                  ] })
                ] })
              ] }, enrollment.id);
            }) })
          ] }),
          activeTab === "certificates" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Your Achievements 🏆" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600", children: "Celebrate your learning milestones and share your success!" })
            ] }),
            certificates.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "text-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-12 w-12 text-orange-500" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Your First Certificate Awaits! ✨" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-8 max-w-md mx-auto", children: "Complete your first course to earn your certificate and join our community of achievers!" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "lg", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-5 w-5 mr-2" }),
                "Start Learning Today"
              ] }) })
            ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: certificates.map((certificate) => {
              var _a2;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Card,
                {
                  className: "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 card-hover overflow-hidden",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-gradient-to-r from-yellow-500 to-orange-500" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-8 w-8 text-white" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2", children: (_a2 = certificate.course) == null ? void 0 : _a2.title }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600 mb-3", children: [
                        "Certificate #",
                        certificate.certificate_number
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500 mb-4", children: [
                        "Issued on ",
                        formatDate(certificate.issue_date)
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-lg p-3 mb-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mb-1", children: "Verification Code" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-sm font-bold text-gray-900", children: certificate.verification_code })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex space-x-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "flex-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$m, { className: "h-4 w-4 mr-1" }),
                          "Download"
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$n, { className: "h-4 w-4" }) })
                      ] })
                    ] })
                  ]
                },
                certificate.id
              );
            }) })
          ] }),
          activeTab === "profile" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Profile Settings" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-3 gap-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Personal Information" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Full Name", value: (user == null ? void 0 : user.full_name) || "", readOnly: true }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Email Address", value: (user == null ? void 0 : user.email) || "", readOnly: true }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Student ID", value: (user == null ? void 0 : user.student_id) || "", readOnly: true }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        label: "Age",
                        value: (user == null ? void 0 : user.date_of_birth) ? ((/* @__PURE__ */ new Date()).getFullYear() - new Date(user.date_of_birth).getFullYear()).toString() : "",
                        readOnly: true
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Phone", value: (user == null ? void 0 : user.phone) || "", readOnly: true }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: "Role", value: (user == null ? void 0 : user.role) || "", readOnly: true })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$s, { className: "h-4 w-4 mr-2" }),
                    "Edit Profile"
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Learning Statistics" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient-to-br from-orange-500 to-red-500 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-2xl font-bold", children: stats.level.charAt(0) }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-lg font-bold text-gray-900", children: [
                      stats.level,
                      " Learner"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600", children: [
                      stats.xpPoints,
                      " XP Points"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Courses Completed:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-green-600", children: stats.completedCourses })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Active Courses:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-blue-600", children: stats.activeCourses })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Certificates:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-purple-600", children: stats.certificatesEarned })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Learning Streak:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-orange-600", children: [
                        stats.learningStreak,
                        " days"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Completion Rate:" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-green-600", children: [
                        Math.round(stats.completionRate),
                        "%"
                      ] })
                    ] })
                  ] })
                ] })
              ] }) })
            ] })
          ] })
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChatBotTrigger, {})
  ] });
}
const courseSchema = objectType({
  gurukul_id: stringType().min(1, "Please select a Gurukul"),
  course_number: stringType().min(1, "Course number is required"),
  title: stringType().min(5, "Title must be at least 5 characters"),
  description: stringType().min(20, "Description must be at least 20 characters"),
  level: enumType(["elementary", "basic", "intermediate", "advanced"]),
  age_group_min: numberType().min(4, "Minimum age must be at least 4"),
  age_group_max: numberType().max(100, "Maximum age must be less than 100"),
  duration_weeks: numberType().min(1, "Duration must be at least 1 week"),
  fee: numberType().min(0, "Fee must be non-negative"),
  price: numberType().min(0, "Price must be non-negative"),
  currency: stringType().default("USD"),
  max_students: numberType().min(1, "Must allow at least 1 student"),
  delivery_method: enumType(["physical", "remote", "hybrid"]),
  entry_requirements: stringType().optional(),
  learning_outcomes: arrayType(stringType()).min(1, "At least one learning outcome is required")
});
function TeacherDashboard() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  const { user } = useWebsiteAuth();
  const [courses, setCourses] = reactExports.useState([]);
  const [enrollments, setEnrollments] = reactExports.useState([]);
  const [gurukuls, setGurukuls] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedEnrollments, setSelectedEnrollments] = reactExports.useState([]);
  const [showCreateCourse, setShowCreateCourse] = reactExports.useState(false);
  const [activeView, setActiveView] = reactExports.useState("overview");
  const [learningOutcomes, setLearningOutcomes] = reactExports.useState([""]);
  const {
    register,
    handleSubmit,
    reset,
    // watch, // For future form monitoring
    // setValue, // For programmatic form updates
    formState: { errors }
  } = useForm({
    resolver: t(courseSchema),
    defaultValues: {
      level: "basic",
      delivery_method: "remote",
      learning_outcomes: [""]
    }
  });
  reactExports.useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);
  const loadDashboardData = async () => {
    try {
      const [coursesData, enrollmentsData, gurukulData] = await Promise.all([
        getTeacherCourses(user.id),
        getTeacherEnrollments(user.id),
        getGurukuls()
      ]);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setGurukuls(gurukulData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      zt.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateCourse = async (data) => {
    try {
      const courseData = {
        ...data,
        teacher_id: user.id,
        is_active: true,
        learning_outcomes: learningOutcomes.filter((outcome) => outcome.trim() !== ""),
        syllabus: null,
        // or {} or "" depending on your requirements
        price: data.price || 0,
        currency: data.currency || "USD"
      };
      await createCourse(courseData);
      await loadDashboardData();
      setShowCreateCourse(false);
      reset();
      setLearningOutcomes([""]);
      zt.success("Course created successfully!");
    } catch (error) {
      console.error("Error creating course:", error);
      zt.error("Failed to create course");
    }
  };
  const handleApproveEnrollment = async (enrollmentId) => {
    try {
      await updateEnrollmentStatus(enrollmentId, "approved");
      await loadDashboardData();
      zt.success("Enrollment approved!");
    } catch (error) {
      console.error("Error approving enrollment:", error);
      zt.error("Failed to approve enrollment");
    }
  };
  const handleRejectEnrollment = async (enrollmentId) => {
    try {
      await updateEnrollmentStatus(enrollmentId, "rejected");
      await loadDashboardData();
      zt.success("Enrollment rejected");
    } catch (error) {
      console.error("Error rejecting enrollment:", error);
      zt.error("Failed to reject enrollment");
    }
  };
  const handleBulkApprove = async () => {
    if (selectedEnrollments.length === 0) {
      zt.error("Please select enrollments to approve");
      return;
    }
    try {
      await bulkUpdateEnrollments(selectedEnrollments, "approved");
      await loadDashboardData();
      setSelectedEnrollments([]);
      zt.success(`${selectedEnrollments.length} enrollments approved!`);
    } catch (error) {
      console.error("Error in bulk approval:", error);
      zt.error("Failed to approve enrollments");
    }
  };
  const handleIssueCertificate = async (enrollmentId) => {
    try {
      await issueCertificate(enrollmentId);
      await loadDashboardData();
      zt.success("Certificate issued successfully!");
    } catch (error) {
      console.error("Error issuing certificate:", error);
      zt.error("Failed to issue certificate");
    }
  };
  const handleBulkIssueCertificates = async () => {
    const eligibleEnrollments = enrollments.filter(
      (e) => e.status === "completed" && !e.certificate_issued
    );
    if (eligibleEnrollments.length === 0) {
      zt.error("No eligible students for certificate issuance");
      return;
    }
    try {
      await bulkIssueCertificates(eligibleEnrollments.map((e) => e.id));
      await loadDashboardData();
      zt.success(`${eligibleEnrollments.length} certificates issued!`);
    } catch (error) {
      console.error("Error in bulk certificate issuance:", error);
      zt.error("Failed to issue certificates");
    }
  };
  const addLearningOutcome = () => {
    setLearningOutcomes([...learningOutcomes, ""]);
  };
  const removeLearningOutcome = (index) => {
    if (learningOutcomes.length > 1) {
      const newOutcomes = learningOutcomes.filter((_, i) => i !== index);
      setLearningOutcomes(newOutcomes);
    }
  };
  const updateLearningOutcome = (index, value) => {
    const newOutcomes = [...learningOutcomes];
    newOutcomes[index] = value;
    setLearningOutcomes(newOutcomes);
  };
  const stats = {
    totalCourses: courses.length,
    totalStudents: enrollments.length,
    pendingApprovals: enrollments.filter((e) => e.status === "pending").length,
    completedCourses: enrollments.filter((e) => e.status === "completed").length,
    certificatesIssued: enrollments.filter((e) => e.certificate_issued).length,
    pendingCertificates: enrollments.filter(
      (e) => e.status === "completed" && !e.certificate_issued
    ).length,
    totalRevenue: enrollments.filter((e) => e.payment_status === "paid").reduce((sum, e) => {
      var _a2;
      return sum + (((_a2 = e.course) == null ? void 0 : _a2.price) || 0);
    }, 0),
    averageRating: enrollments.length > 0 ? enrollments.length * 4.5 / enrollments.length : 0
  };
  const recentActivity = [
    {
      type: "enrollment",
      message: "New enrollment in Hindu Philosophy",
      time: "2 minutes ago",
      icon: ForwardRef$v
    },
    {
      type: "completion",
      message: "Student completed Sanskrit Basics",
      time: "1 hour ago",
      icon: ForwardRef$h
    },
    {
      type: "certificate",
      message: "Certificate issued to Sarah Johnson",
      time: "3 hours ago",
      icon: ForwardRef$w
    },
    { type: "course", message: "Course materials updated", time: "1 day ago", icon: ForwardRef$b }
  ];
  const quickActions = [
    {
      title: "Create New Course",
      description: "Design and launch a new course",
      icon: ForwardRef$q,
      action: () => setShowCreateCourse(true),
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      highlight: true
    },
    {
      title: "Review Enrollments",
      description: `${stats.pendingApprovals} pending approvals`,
      icon: ForwardRef$z,
      action: () => setActiveView("students"),
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      badge: stats.pendingApprovals
    },
    {
      title: "Issue Certificates",
      description: `${stats.pendingCertificates} ready to issue`,
      icon: ForwardRef$c,
      action: () => setActiveView("certificates"),
      color: "bg-gradient-to-r from-green-500 to-green-600",
      badge: stats.pendingCertificates
    },
    {
      title: "View Analytics",
      description: "Track your teaching performance",
      icon: ForwardRef$f,
      action: () => setActiveView("analytics"),
      color: "bg-gradient-to-r from-purple-500 to-purple-600"
    }
  ];
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-16 lg:pt-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner w-12 h-12 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-lg", children: "Loading your teaching dashboard..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 lg:pt-20", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-16 lg:top-20 z-40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$t, { className: "h-7 w-7 text-white" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent", children: [
              "Welcome back, ",
              ((_a = user == null ? void 0 : user.full_name) == null ? void 0 : _a.split(" ")[0]) || "Teacher",
              "! 👋"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Ready to inspire minds today?" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$u, { className: "h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" }),
            stats.pendingApprovals > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse", children: stats.pendingApprovals })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$o, { className: "h-4 w-4 mr-1" }),
            stats.averageRating,
            " Rating"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 flex space-x-2 bg-gray-100/50 p-1 rounded-xl w-fit", children: [
        { id: "overview", name: "Overview", icon: ForwardRef$f },
        { id: "courses", name: "My Courses", icon: ForwardRef$b },
        { id: "students", name: "Students", icon: ForwardRef$v },
        { id: "certificates", name: "Certificates", icon: ForwardRef$w },
        { id: "analytics", name: "Analytics", icon: ForwardRef$x }
      ].map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setActiveView(
            tab.id
          ),
          className: `flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeView === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-white/50"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: tab.name })
          ]
        },
        tab.id
      )) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max py-8", children: [
      activeView === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-blue-100 text-sm font-medium", children: "Total Courses" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: stats.totalCourses })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$b, { className: "h-8 w-8 text-blue-200" })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-green-100 text-sm font-medium", children: "Total Students" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: stats.totalStudents })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$v, { className: "h-8 w-8 text-green-200" })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-purple-100 text-sm font-medium", children: "Certificates" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: stats.certificatesIssued })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-8 w-8 text-purple-200" })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-orange-100 text-sm font-medium", children: "Revenue" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: formatCurrency(stats.totalRevenue) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$y, { className: "h-8 w-8 text-orange-200" })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-6 w-6 text-blue-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Quick Actions" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: quickActions.map((action, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              onClick: action.action,
              className: `relative p-6 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${action.color} text-white group`,
              children: [
                action.highlight && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse", children: "NEW" }),
                action.badge && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full", children: action.badge }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(action.icon, { className: "h-8 w-8 mb-3 group-hover:scale-110 transition-transform" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: action.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm opacity-90", children: action.description })
              ]
            },
            index
          )) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$e, { className: "h-6 w-6 text-orange-600" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Recent Activity" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: recentActivity.map((activity, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center space-x-4 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(activity.icon, { className: "h-5 w-5 text-white" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900", children: activity.message }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: activity.time })
                  ] })
                ]
              },
              index
            )) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "h-6 w-6 text-yellow-600" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Performance Insights" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$h, { className: "h-5 w-5 text-green-600" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-green-800", children: "Excellent Completion Rate" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-700", children: "85% of your students complete courses successfully" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$o, { className: "h-5 w-5 text-blue-600" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-blue-800", children: "High Student Satisfaction" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-blue-700", children: [
                  "Average rating of ",
                  stats.averageRating,
                  "/5.0 from students"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-5 w-5 text-purple-600" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-purple-800", children: "Certificate Achievement" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-purple-700", children: [
                  stats.certificatesIssued,
                  " certificates issued this month"
                ] })
              ] })
            ] }) })
          ] })
        ] })
      ] }),
      activeView === "courses" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "My Courses" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Manage and create your educational content" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => setShowCreateCourse(true),
              className: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$q, { className: "h-5 w-5 mr-2" }),
                "Create New Course"
              ]
            }
          )
        ] }),
        courses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "text-center py-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$b, { className: "h-16 w-16 text-gray-400 mx-auto mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "No courses yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-6", children: "Create your first course to start teaching!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: () => setShowCreateCourse(true),
              className: "bg-gradient-to-r from-blue-600 to-purple-600",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$q, { className: "h-5 w-5 mr-2" }),
                "Create Your First Course"
              ]
            }
          )
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: courses.map((course) => {
          const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
          const pendingCertificates = courseEnrollments.filter(
            (e) => e.status === "completed" && !e.certificate_issued
          ).length;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Card,
            {
              className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-32 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-t-lg relative overflow-hidden", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/20" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-4 left-4 text-white", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: `${getLevelColor(course.level)} mb-2`, children: course.level }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm opacity-90", children: course.course_number })
                  ] }),
                  pendingCertificates > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse", children: [
                    pendingCertificates,
                    " Certificates"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors", children: course.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm mb-4 line-clamp-2", children: course.description }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4 text-sm", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$A, { className: "h-4 w-4 text-gray-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        courseEnrollments.length,
                        " students"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$z, { className: "h-4 w-4 text-gray-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        course.duration_weeks,
                        " weeks"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$y, { className: "h-4 w-4 text-gray-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCurrency(course.price) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-4 w-4 text-gray-400" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                        courseEnrollments.filter((e) => e.certificate_issued).length,
                        " ",
                        "certified"
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/courses/${course.id}`, className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "w-full", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$B, { className: "h-4 w-4 mr-1" }),
                      "View Details"
                    ] }) }),
                    pendingCertificates > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        size: "sm",
                        onClick: () => {
                          const eligibleEnrollments = courseEnrollments.filter(
                            (e) => e.status === "completed" && !e.certificate_issued
                          );
                          if (eligibleEnrollments.length > 0) {
                            bulkIssueCertificates(eligibleEnrollments.map((e) => e.id));
                          }
                        },
                        className: "bg-gradient-to-r from-green-500 to-green-600",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$l, { className: "h-4 w-4 mr-1" }),
                          "Issue (",
                          pendingCertificates,
                          ")"
                        ]
                      }
                    )
                  ] })
                ] })
              ]
            },
            course.id
          );
        }) })
      ] }),
      activeView === "students" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Student Management" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Review enrollments and manage student progress" })
          ] }),
          selectedEnrollments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleBulkApprove,
              className: "bg-gradient-to-r from-green-500 to-green-600",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$h, { className: "h-5 w-5 mr-2" }),
                "Approve Selected (",
                selectedEnrollments.length,
                ")"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$v, { className: "h-8 w-8 text-blue-600 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-blue-900", children: stats.totalStudents }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-blue-700", children: "Total Students" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$z, { className: "h-8 w-8 text-orange-600 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-orange-900", children: stats.pendingApprovals }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-orange-700", children: "Pending Approvals" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-green-50 to-green-100 border-green-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$h, { className: "h-8 w-8 text-green-600 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-green-900", children: enrollments.filter((e) => e.status === "approved").length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-green-700", children: "Active Students" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-8 w-8 text-purple-600 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-purple-900", children: stats.completedCourses }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-purple-700", children: "Completed" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-6", children: enrollments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$v, { className: "h-16 w-16 text-gray-400 mx-auto mb-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No students yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Students will appear here once they enroll in your courses." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-gray-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-3 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "checkbox",
                onChange: (e) => {
                  if (e.target.checked) {
                    setSelectedEnrollments(
                      enrollments.filter((e2) => e2.status === "pending").map((e2) => e2.id)
                    );
                  } else {
                    setSelectedEnrollments([]);
                  }
                },
                className: "rounded border-gray-300"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-3 px-4 font-semibold", children: "Student" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-3 px-4 font-semibold", children: "Course" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-3 px-4 font-semibold", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-3 px-4 font-semibold", children: "Enrolled" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-3 px-4 font-semibold", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: enrollments.map((enrollment) => {
            var _a2, _b2, _c2, _d2, _e2, _f2;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "tr",
              {
                className: "border-b border-gray-100 hover:bg-gray-50/50",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4", children: enrollment.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: selectedEnrollments.includes(enrollment.id),
                      onChange: (e) => {
                        if (e.target.checked) {
                          setSelectedEnrollments([
                            ...selectedEnrollments,
                            enrollment.id
                          ]);
                        } else {
                          setSelectedEnrollments(
                            selectedEnrollments.filter((id) => id !== enrollment.id)
                          );
                        }
                      },
                      className: "rounded border-gray-300"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-sm font-bold", children: ((_b2 = (_a2 = enrollment.student) == null ? void 0 : _a2.full_name) == null ? void 0 : _b2.charAt(0)) || "S" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: (_c2 = enrollment.student) == null ? void 0 : _c2.full_name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: (_d2 = enrollment.student) == null ? void 0 : _d2.email })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: (_e2 = enrollment.course) == null ? void 0 : _e2.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: (_f2 = enrollment.course) == null ? void 0 : _f2.course_number })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: getStatusColor(enrollment.status), children: enrollment.status }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4 text-sm text-gray-600", children: formatDate(enrollment.enrolled_at) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                    enrollment.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          size: "sm",
                          onClick: () => handleApproveEnrollment(enrollment.id),
                          className: "bg-green-600 hover:bg-green-700",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$h, { className: "h-4 w-4" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          size: "sm",
                          variant: "outline",
                          onClick: () => handleRejectEnrollment(enrollment.id),
                          className: "text-red-600 border-red-300 hover:bg-red-50",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$C, { className: "h-4 w-4" })
                        }
                      )
                    ] }),
                    enrollment.status === "completed" && !enrollment.certificate_issued && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        size: "sm",
                        onClick: () => handleIssueCertificate(enrollment.id),
                        className: "bg-gradient-to-r from-purple-500 to-purple-600",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-4 w-4 mr-1" }),
                          "Issue Certificate"
                        ]
                      }
                    )
                  ] }) })
                ]
              },
              enrollment.id
            );
          }) })
        ] }) }) }) })
      ] }),
      activeView === "certificates" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Certificate Management" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Issue and manage student certificates" })
          ] }),
          stats.pendingCertificates > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleBulkIssueCertificates,
              className: "bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-5 w-5 mr-2" }),
                "Issue All Eligible (",
                stats.pendingCertificates,
                ")"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-green-50 to-green-100 border-green-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-10 w-10 text-green-600 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-green-900", children: stats.certificatesIssued }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-green-700", children: "Certificates Issued" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$z, { className: "h-10 w-10 text-orange-600 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-orange-900", children: stats.pendingCertificates }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-orange-700", children: "Pending Certificates" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$h, { className: "h-10 w-10 text-blue-600 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold text-blue-900", children: stats.completedCourses }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-blue-700", children: "Completed Courses" })
          ] }) })
        ] }),
        stats.pendingCertificates > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$z, { className: "h-6 w-6 text-orange-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Pending Certificates" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4", children: enrollments.filter((e) => e.status === "completed" && !e.certificate_issued).map((enrollment) => {
            var _a2, _b2, _c2, _d2;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3 mb-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold", children: ((_b2 = (_a2 = enrollment.student) == null ? void 0 : _a2.full_name) == null ? void 0 : _b2.charAt(0)) || "S" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-orange-900", children: (_c2 = enrollment.student) == null ? void 0 : _c2.full_name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-orange-700", children: (_d2 = enrollment.course) == null ? void 0 : _d2.title })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-orange-600 mb-3", children: [
                    "Completed:",
                    " ",
                    formatDate(enrollment.completed_at || enrollment.enrolled_at)
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      size: "sm",
                      onClick: () => handleIssueCertificate(enrollment.id),
                      className: "w-full bg-gradient-to-r from-purple-500 to-purple-600",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-4 w-4 mr-1" }),
                        "Issue Certificate"
                      ]
                    }
                  )
                ]
              },
              enrollment.id
            );
          }) }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-6 w-6 text-green-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Issued Certificates" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: stats.certificatesIssued === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$w, { className: "h-16 w-16 text-gray-400 mx-auto mb-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No certificates issued yet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Certificates will appear here once you issue them to students." })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4", children: enrollments.filter((e) => e.certificate_issued).map((enrollment) => {
            var _a2, _b2;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3 mb-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-5 w-5 text-white" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-green-900", children: (_a2 = enrollment.student) == null ? void 0 : _a2.full_name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-700", children: (_b2 = enrollment.course) == null ? void 0 : _b2.title })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-green-600", children: [
                    "Issued: ",
                    formatDate(enrollment.updated_at)
                  ] })
                ]
              },
              enrollment.id
            );
          }) }) })
        ] })
      ] }),
      activeView === "analytics" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Teaching Analytics" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Track your performance and student engagement" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$o, { className: "h-10 w-10 mx-auto mb-3 text-blue-200" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: stats.averageRating }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-blue-100", children: "Average Rating" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$h, { className: "h-10 w-10 mx-auto mb-3 text-green-200" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: "85%" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-green-100", children: "Completion Rate" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$v, { className: "h-10 w-10 mx-auto mb-3 text-purple-200" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: Math.round(stats.totalStudents / stats.totalCourses) || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-purple-100", children: "Avg Students/Course" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$y, { className: "h-10 w-10 mx-auto mb-3 text-orange-200" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold", children: formatCurrency(stats.totalRevenue / stats.totalCourses || 0) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-orange-100", children: "Avg Revenue/Course" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-0 shadow-xl bg-white/70 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold", children: "Course Performance" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: courses.map((course) => {
            const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
            const completionRate = courseEnrollments.length > 0 ? Math.round(
              courseEnrollments.filter((e) => e.status === "completed").length / courseEnrollments.length * 100
            ) : 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium", children: course.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Badge,
                  {
                    className: completionRate >= 80 ? "bg-green-100 text-green-800" : completionRate >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800",
                    children: [
                      completionRate,
                      "% completion"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-4 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Enrolled:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: courseEnrollments.length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Completed:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: courseEnrollments.filter((e) => e.status === "completed").length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Certificates:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: courseEnrollments.filter((e) => e.certificate_issued).length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Revenue:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: formatCurrency(
                    courseEnrollments.filter((e) => e.payment_status === "paid").reduce((sum, e) => {
                      var _a2;
                      return sum + (((_a2 = e.course) == null ? void 0 : _a2.price) || 0);
                    }, 0)
                  ) })
                ] })
              ] })
            ] }, course.id);
          }) }) })
        ] })
      ] })
    ] }),
    showCreateCourse && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-b border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Create New Course" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Design your next educational masterpiece" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => {
              setShowCreateCourse(false);
              reset();
              setLearningOutcomes([""]);
            },
            className: "text-gray-400 hover:text-gray-600 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$C, { className: "h-6 w-6" })
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit(handleCreateCourse), className: "p-6 space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Gurukul" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                ...register("gurukul_id"),
                className: "block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select a Gurukul" }),
                  gurukuls.map((gurukul) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: gurukul.id, children: gurukul.name }, gurukul.id))
                ]
              }
            ),
            errors.gurukul_id && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: errors.gurukul_id.message })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Course Number",
              placeholder: "e.g., C1001",
              ...register("course_number"),
              error: (_b = errors.course_number) == null ? void 0 : _b.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Course Title",
              placeholder: "Enter an engaging course title",
              ...register("title"),
              error: (_c = errors.title) == null ? void 0 : _c.message
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                ...register("description"),
                rows: 4,
                className: "block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                placeholder: "Describe what students will learn and achieve"
              }
            ),
            errors.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: errors.description.message })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Level" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                ...register("level"),
                className: "block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "elementary", children: "Elementary (4-7 years)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "basic", children: "Basic (8-11 years)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "intermediate", children: "Intermediate (12-15 years)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "advanced", children: "Advanced (16-19 years)" })
                ]
              }
            ),
            errors.level && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: errors.level.message })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Delivery Method" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                ...register("delivery_method"),
                className: "block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "remote", children: "Online" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "physical", children: "In-person" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "hybrid", children: "Hybrid" })
                ]
              }
            ),
            errors.delivery_method && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: errors.delivery_method.message })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Minimum Age",
              type: "number",
              ...register("age_group_min", { valueAsNumber: true }),
              error: (_d = errors.age_group_min) == null ? void 0 : _d.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Maximum Age",
              type: "number",
              ...register("age_group_max", { valueAsNumber: true }),
              error: (_e = errors.age_group_max) == null ? void 0 : _e.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Duration (weeks)",
              type: "number",
              ...register("duration_weeks", { valueAsNumber: true }),
              error: (_f = errors.duration_weeks) == null ? void 0 : _f.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Course Fee (€)",
              type: "number",
              step: "0.01",
              ...register("fee", { valueAsNumber: true }),
              error: (_g = errors.fee) == null ? void 0 : _g.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Maximum Students",
              type: "number",
              ...register("max_students", { valueAsNumber: true }),
              error: (_h = errors.max_students) == null ? void 0 : _h.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Entry Requirements (Optional)",
              placeholder: "Any prerequisites or requirements",
              ...register("entry_requirements"),
              error: (_i = errors.entry_requirements) == null ? void 0 : _i.message
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Learning Outcomes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: addLearningOutcome, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$q, { className: "h-4 w-4 mr-1" }),
              "Add Outcome"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: learningOutcomes.map((outcome, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: outcome,
                onChange: (e) => updateLearningOutcome(index, e.target.value),
                placeholder: `Learning outcome ${index + 1}`,
                className: "flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              }
            ),
            learningOutcomes.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => removeLearningOutcome(index),
                className: "text-red-600 border-red-300 hover:bg-red-50",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$C, { className: "h-4 w-4" })
              }
            )
          ] }, index)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end space-x-4 pt-6 border-t border-gray-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => {
                setShowCreateCourse(false);
                reset();
                setLearningOutcomes([""]);
              },
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "submit",
              className: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-5 w-5 mr-2" }),
                "Create Course"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
function DashboardPage() {
  const { loading: authLoading, isSuperAdmin } = useAuth();
  const { user: websiteUser, loading: websiteLoading } = useWebsiteAuth();
  if (authLoading || websiteLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center page-with-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner w-8 h-8 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Loading dashboard..." })
    ] }) });
  }
  if (isSuperAdmin) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/admin/dashboard", replace: true });
  }
  if (websiteUser) {
    switch (websiteUser.role) {
      case "student":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/dashboard/student", replace: true });
      case "teacher":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/dashboard/teacher", replace: true });
      case "admin":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/dashboard/admin", replace: true });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true });
}
export {
  AuthProvider as A,
  Button as B,
  Card as C,
  DashboardPage as D,
  Input as I,
  StudentDashboard as S,
  TeacherDashboard as T,
  WebsiteAuthProvider as W,
  useWebsiteAuth as a,
  CardHeader as b,
  CardContent as c,
  Badge as d,
  getGurukuls as e,
  getLevelColor as f,
  getCourses as g,
  getAgeGroupLabel as h,
  formatCurrency as i,
  CardTitle as j,
  CardDescription as k,
  supabaseAdmin as s,
  useAuth as u
};
