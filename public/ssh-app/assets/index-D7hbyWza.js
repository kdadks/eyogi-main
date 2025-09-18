import { r as reactExports, Y as useLocation, j as jsxRuntimeExports, Z as motion, L as Link, _ as User, $ as LogOut, a0 as AnimatePresence, a1 as X, a2 as Menu, a3 as GraduationCap, a4 as Users, a5 as BookOpen, a6 as useNavigate, H as useForm, b as ForwardRef, z as zt, U as Navigate, R as React, C as ForwardRef$1, t as ForwardRef$2, I as ForwardRef$3, m as ForwardRef$4, K as ForwardRef$5, B as ForwardRef$6, s as ForwardRef$7, a7 as ForwardRef$8, a8 as ForwardRef$9, a9 as ForwardRef$a, aa as ForwardRef$b, P as ForwardRef$c, ab as ForwardRef$d, f as ForwardRef$e, E as ForwardRef$f, ac as ForwardRef$g, O as ForwardRef$h, ad as ForwardRef$i, S as ForwardRef$j, l as ForwardRef$k, Q as ForwardRef$l, ae as ForwardRef$m, af as ForwardRef$n, q as ForwardRef$o, ag as ForwardRef$p, ah as ForwardRef$q, ai as NavLink, aj as ForwardRef$r, o as ForwardRef$s, J as ForwardRef$t, ak as Outlet, N as ForwardRef$u, al as Mail, am as Shield, an as Calendar, ao as LoaderCircle, ap as Save, aq as ForwardRef$v, ar as ForwardRef$w, as as ForwardRef$x, at as ForwardRef$y, au as CircleAlert, av as RefreshCw, aw as CircleCheckBig, ax as Settings, ay as Book, az as Routes, aA as Route, aB as Fe, aC as client, aD as BrowserRouter } from "./vendor-C3mZwoH-.js";
import { u as useAuth, a as useWebsiteAuth, B as Button, C as Card, b as CardHeader, c as CardContent, I as Input, d as Badge, g as getCourses, e as getGurukuls, f as getLevelColor, h as getAgeGroupLabel, i as formatCurrency, s as supabaseAdmin, j as CardTitle, k as CardDescription, D as DashboardPage, S as StudentDashboard, T as TeacherDashboard, A as AuthProvider, W as WebsiteAuthProvider } from "./dashboard-Baeq46t6.js";
import { o as objectType, s as stringType, e as enumType, t } from "./forms-BFeaBwj6.js";
import "./utils-DZ0rb0Yx.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const logoImage = "/ssh-app/eyogiTextLess.png";
const fallbackLogo = "/ssh-app/Images/Logo.png";
const navLinks = [
  { name: "Home", href: "/", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "w-4 h-4" }) },
  { name: "About", href: "/about", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" }) },
  { name: "Courses", href: "/courses", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-4 h-4" }) },
  { name: "Gurukuls", href: "/gurukuls", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "w-4 h-4" }) },
  { name: "Contact", href: "/contact", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-4 h-4" }) }
];
function GlossyHeader({ onOpenAuthModal }) {
  const [isScrolled, setIsScrolled] = reactExports.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = reactExports.useState(false);
  const location = useLocation();
  const { user: superAdminUser } = useAuth();
  const { user: websiteUser, signOut: websiteSignOut } = useWebsiteAuth();
  reactExports.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const headerVariants = {
    top: {
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(0px)",
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
    },
    scrolled: {
      background: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(20px)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
    }
  };
  const logoVariants = {
    initial: { scale: 1, filter: "drop-shadow(0 0 0px rgba(255, 165, 0, 0))" },
    hover: {
      scale: 1.05,
      filter: "drop-shadow(0 0 20px rgba(255, 165, 0, 0.6))",
      transition: { duration: 0.3 }
    }
  };
  const linkVariants = {
    initial: {
      scale: 1,
      background: "rgba(0, 0, 0, 0)",
      color: "rgba(31, 41, 55, 0.9)"
    },
    hover: {
      scale: 1.05,
      background: "rgba(249, 115, 22, 0.1)",
      color: "rgba(220, 38, 38, 1)",
      boxShadow: "0 4px 20px rgba(255, 165, 0, 0.3)"
    }
  };
  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren"
      }
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  const mobileItemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.header,
    {
      className: "fixed top-0 left-0 right-0 z-50 border-b border-white/10",
      variants: headerVariants,
      animate: isScrolled ? "scrolled" : "top",
      transition: { duration: 0.3 },
      style: {
        background: isScrolled ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
        backdropFilter: isScrolled ? "blur(20px)" : "blur(0px)",
        boxShadow: isScrolled ? "0 8px 32px rgba(0, 0, 0, 0.1)" : "0 0 0 rgba(0, 0, 0, 0)"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between h-16 lg:h-20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            motion.div,
            {
              variants: logoVariants,
              initial: "initial",
              whileHover: "hover",
              className: "flex items-center space-x-3",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center space-x-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: logoImage,
                      alt: "eYogi Gurukul",
                      className: "h-10 w-10 lg:h-12 lg:w-12 rounded-full border-2 border-white/20",
                      onError: (e) => {
                        const target = e.target;
                        target.src = fallbackLogo;
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/20 to-red-500/20" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:block", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg lg:text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent", children: "SSH University" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm lg:text-base font-medium text-gray-600", children: "eYogi Gurukul" })
                ] })
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden lg:flex items-center space-x-1", children: [
            navLinks.map((link) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                variants: linkVariants,
                initial: "initial",
                whileHover: "hover",
                whileTap: { scale: 0.98 },
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Link,
                  {
                    to: link.href,
                    className: `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 relative overflow-hidden ${location.pathname === link.href ? "text-gray-900 bg-orange-100 shadow-lg" : "text-gray-700 hover:text-gray-900"}`,
                    children: [
                      link.icon,
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: link.name }),
                      location.pathname === link.href && /* @__PURE__ */ jsxRuntimeExports.jsx(
                        motion.div,
                        {
                          className: "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-red-500",
                          layoutId: "activeTab",
                          transition: { duration: 0.3 }
                        }
                      )
                    ]
                  }
                )
              },
              link.name
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                variants: linkVariants,
                initial: "initial",
                whileHover: "hover",
                whileTap: { scale: 0.98 },
                className: "ml-4 pl-4 border-l border-gray-300",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    href: "/",
                    onClick: () => window.location.href = "/",
                    className: "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 relative overflow-hidden text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "← eYogi Gurukul" })
                  }
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
            websiteUser ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden lg:flex items-center space-x-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                motion.div,
                {
                  className: "flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-100 backdrop-blur-sm",
                  whileHover: { scale: 1.05 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-4 h-4 text-gray-600" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-800", children: websiteUser.full_name || websiteUser.email || "User" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.button,
                {
                  onClick: websiteSignOut,
                  className: "p-2 rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all duration-200",
                  whileHover: { scale: 1.1 },
                  whileTap: { scale: 0.95 },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4" })
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden lg:flex items-center space-x-12", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => onOpenAuthModal == null ? void 0 : onOpenAuthModal("signin"),
                  className: "bg-white/20 backdrop-blur-md border-white/30 text-gray-800 hover:bg-white/30 hover:border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative z-10", children: "Sign In" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  size: "sm",
                  onClick: () => onOpenAuthModal == null ? void 0 : onOpenAuthModal("signup"),
                  className: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl border-0",
                  children: "Get Started"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.button,
              {
                className: "lg:hidden p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors",
                onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
                whileHover: { scale: 1.1 },
                whileTap: { scale: 0.95 },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: isMobileMenuOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  motion.div,
                  {
                    initial: { rotate: -90, opacity: 0 },
                    animate: { rotate: 0, opacity: 1 },
                    exit: { rotate: 90, opacity: 0 },
                    transition: { duration: 0.2 },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-6 h-6" })
                  },
                  "close"
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  motion.div,
                  {
                    initial: { rotate: 90, opacity: 0 },
                    animate: { rotate: 0, opacity: 1 },
                    exit: { rotate: -90, opacity: 0 },
                    transition: { duration: 0.2 },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "w-6 h-6" })
                  },
                  "menu"
                ) })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isMobileMenuOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            className: "lg:hidden border-t border-gray-200 bg-white/90 backdrop-blur-md",
            variants: mobileMenuVariants,
            initial: "closed",
            animate: "open",
            exit: "closed",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-2 pt-2 pb-3 space-y-1", children: [
              navLinks.map((link) => /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: mobileItemVariants, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Link,
                {
                  to: link.href,
                  onClick: () => setIsMobileMenuOpen(false),
                  className: `flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${location.pathname === link.href ? "text-gray-900 bg-orange-100 shadow-lg" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"}`,
                  children: [
                    link.icon,
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: link.name })
                  ]
                }
              ) }, link.name)),
              /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: mobileItemVariants, className: "pt-2 border-t border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: "/",
                  onClick: () => {
                    setIsMobileMenuOpen(false);
                    window.location.href = "/";
                  },
                  className: "flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 text-blue-600 hover:text-blue-800 hover:bg-blue-50",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "← eYogi Gurukul" })
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                motion.div,
                {
                  className: "pt-4 border-t border-gray-200 space-y-2",
                  variants: mobileItemVariants,
                  children: websiteUser ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3 px-3 py-2 text-gray-800", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-4 h-4" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: websiteUser.full_name || websiteUser.email || "User" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: () => {
                          websiteSignOut();
                          setIsMobileMenuOpen(false);
                        },
                        className: "flex items-center space-x-3 px-3 py-2 w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sign Out" })
                        ]
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        onClick: () => {
                          onOpenAuthModal == null ? void 0 : onOpenAuthModal("signin");
                          setIsMobileMenuOpen(false);
                        },
                        className: "block w-full px-3 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-gray-800 hover:bg-white/30 hover:border-white/40 rounded-lg font-medium shadow-lg transition-all duration-200 relative overflow-hidden",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative z-10", children: "Sign In" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => {
                          onOpenAuthModal == null ? void 0 : onOpenAuthModal("signup");
                          setIsMobileMenuOpen(false);
                        },
                        className: "block w-full px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium shadow-lg",
                        children: "Get Started"
                      }
                    )
                  ] })
                }
              )
            ] })
          }
        ) })
      ] })
    }
  );
}
const signInSchema = objectType({
  email: stringType().email("Please enter a valid email address"),
  password: stringType().min(6, "Password must be at least 6 characters")
});
const signUpSchema = objectType({
  email: stringType().email("Please enter a valid email address"),
  password: stringType().min(6, "Password must be at least 6 characters"),
  confirmPassword: stringType(),
  full_name: stringType().min(2, "Full name must be at least 2 characters"),
  role: enumType(["student", "teacher"]),
  phone: stringType().optional(),
  date_of_birth: stringType().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
function WebsiteAuthModal({
  isOpen,
  onClose,
  initialMode = "signin"
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const [mode, setMode] = reactExports.useState(initialMode);
  const [loading, setLoading] = reactExports.useState(false);
  const { signIn, signUp } = useWebsiteAuth();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);
  const signInForm = useForm({
    resolver: t(signInSchema)
  });
  const signUpForm = useForm({
    resolver: t(signUpSchema),
    defaultValues: {
      role: "student"
    }
  });
  reactExports.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);
  const handleSignIn = async (data) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        zt.error(error);
        return;
      }
      zt.success("Welcome back!");
      onClose();
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        zt.error(error.message);
      } else {
        zt.error("Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleSignUp = async (data) => {
    setLoading(true);
    try {
      const { error } = await signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone,
        date_of_birth: data.date_of_birth
      });
      if (error) {
        zt.error(error);
        return;
      }
      zt.success("Account created successfully! You can now sign in.");
      setMode("signin");
      signUpForm.reset();
    } catch (error) {
      if (error instanceof Error) {
        zt.error(error.message);
      } else {
        zt.error("Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto animate-in fade-in duration-200",
      onClick: handleOverlayClick,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-md w-full my-8 animate-in zoom-in-95 duration-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "shadow-2xl border-0 bg-white/95 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900", children: mode === "signin" ? "Sign In" : "Create Account" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onClose,
              className: "p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-5 w-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: mode === "signin" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: signInForm.handleSubmit(handleSignIn), className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Email address",
              type: "email",
              autoComplete: "email",
              ...signInForm.register("email"),
              error: (_a = signInForm.formState.errors.email) == null ? void 0 : _a.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Password",
              type: "password",
              autoComplete: "current-password",
              ...signInForm.register("password"),
              error: (_b = signInForm.formState.errors.password) == null ? void 0 : _b.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", loading, children: "Sign in" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600", children: [
            "Don't have an account?",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setMode("signup"),
                className: "font-medium text-orange-600 hover:text-orange-500",
                children: "Sign up"
              }
            )
          ] }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: signUpForm.handleSubmit(handleSignUp), className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Full Name",
              ...signUpForm.register("full_name"),
              error: (_c = signUpForm.formState.errors.full_name) == null ? void 0 : _c.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Email address",
              type: "email",
              autoComplete: "email",
              ...signUpForm.register("email"),
              error: (_d = signUpForm.formState.errors.email) == null ? void 0 : _d.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                label: "Password",
                type: "password",
                autoComplete: "new-password",
                ...signUpForm.register("password"),
                error: (_e = signUpForm.formState.errors.password) == null ? void 0 : _e.message
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                label: "Confirm Password",
                type: "password",
                autoComplete: "new-password",
                ...signUpForm.register("confirmPassword"),
                error: (_f = signUpForm.formState.errors.confirmPassword) == null ? void 0 : _f.message
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "role", className: "block text-sm font-medium text-gray-700 mb-1", children: "I am a" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  ...signUpForm.register("role"),
                  className: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "student", children: "Student" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "teacher", children: "Teacher" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                label: "Phone (Optional)",
                type: "tel",
                ...signUpForm.register("phone"),
                error: (_g = signUpForm.formState.errors.phone) == null ? void 0 : _g.message
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              label: "Date of Birth (Optional)",
              type: "date",
              ...signUpForm.register("date_of_birth"),
              error: (_h = signUpForm.formState.errors.date_of_birth) == null ? void 0 : _h.message
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", loading, children: "Create Account" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600", children: [
            "Already have an account?",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => setMode("signin"),
                className: "font-medium text-orange-600 hover:text-orange-500",
                children: "Sign in"
              }
            )
          ] }) })
        ] }) })
      ] }) })
    }
  );
}
const AuthRedirect = ({ openModal }) => {
  const location = useLocation();
  reactExports.useEffect(() => {
    if (location.pathname.includes("/auth/signin")) {
      openModal("signin");
    } else if (location.pathname.includes("/auth/signup")) {
      openModal("signup");
    }
  }, [location.pathname, openModal]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
};
function ScrollLink({ to, children, onClick, ...props }) {
  const navigate = useNavigate();
  const handleClick = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    navigate(to);
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    if (onClick) {
      onClick(e);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to, onClick: handleClick, ...props, children });
}
function SEOHead({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  ogType = "website",
  structuredData,
  noIndex = false
}) {
  const siteTitle = "eYogi Gurukul - Ancient Hindu Wisdom, Modern Vedic Learning";
  const siteDescription = "Learn authentic Hindu traditions, Vedic philosophy, Sanskrit, mantras, and yoga through comprehensive online courses. Discover Sanatan Dharma wisdom with expert teachers in our traditional Gurukul system.";
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://eyogi-gurukul.vercel.app";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const fullDescription = description || siteDescription;
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
  const fullOgImage = ogImage || `${siteUrl}/og-image.jpg`;
  const coreKeywords = [
    "Hindu",
    "Hinduism",
    "Vedic",
    "Hindu Religion",
    "Hindu Culture",
    "Indian Hindu Culture",
    "Sanatan",
    "Sanatan Dharma",
    "Vedic Education",
    "Hindu Philosophy",
    "Hindu Traditions",
    "Hindu Learning",
    "Vedic Wisdom",
    "Hindu Courses",
    "Vedic Studies",
    "Hindu Gurukul",
    "Sanatan Dharma Education",
    "Hindu Online Learning",
    "Vedic Knowledge",
    "Hindu Spiritual Education",
    "Traditional Hindu Education",
    "Authentic Hindu Teaching",
    "Hindu Heritage",
    "Vedic Philosophy",
    "Hindu Scriptures",
    "Dharma Education",
    "Hindu Values",
    "Sanskrit Learning",
    "Mantra Education",
    "Yoga Philosophy",
    "Hindu Festivals",
    "Hindu Rituals",
    "Hindu Practices",
    "Vedic Science",
    "Hindu Mythology",
    "Hindu Ethics",
    "Dharmic Living",
    "Hindu Spirituality",
    "Vedic Lifestyle"
  ];
  const allKeywords = [...coreKeywords, ...keywords].join(", ");
  React.useEffect(() => {
    document.title = fullTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", fullDescription);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = fullDescription;
      document.head.appendChild(meta);
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", allKeywords);
    } else {
      const meta = document.createElement("meta");
      meta.name = "keywords";
      meta.content = allKeywords;
      document.head.appendChild(meta);
    }
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute("href", fullCanonicalUrl);
    } else {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      canonicalLink.href = fullCanonicalUrl;
      document.head.appendChild(canonicalLink);
    }
    const updateOGTag = (property, content) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (ogTag) {
        ogTag.setAttribute("content", content);
      } else {
        ogTag = document.createElement("meta");
        ogTag.setAttribute("property", property);
        ogTag.setAttribute("content", content);
        document.head.appendChild(ogTag);
      }
    };
    updateOGTag("og:title", fullTitle);
    updateOGTag("og:description", fullDescription);
    updateOGTag("og:type", ogType);
    updateOGTag("og:url", fullCanonicalUrl);
    updateOGTag("og:image", fullOgImage);
    updateOGTag("og:site_name", "eYogi Gurukul");
    const updateTwitterTag = (name, content) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`);
      if (twitterTag) {
        twitterTag.setAttribute("content", content);
      } else {
        twitterTag = document.createElement("meta");
        twitterTag.setAttribute("name", name);
        twitterTag.setAttribute("content", content);
        document.head.appendChild(twitterTag);
      }
    };
    updateTwitterTag("twitter:card", "summary_large_image");
    updateTwitterTag("twitter:title", fullTitle);
    updateTwitterTag("twitter:description", fullDescription);
    updateTwitterTag("twitter:image", fullOgImage);
    const robotsTag = document.querySelector('meta[name="robots"]');
    const robotsContent = noIndex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
    if (robotsTag) {
      robotsTag.setAttribute("content", robotsContent);
    } else {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = robotsContent;
      document.head.appendChild(meta);
    }
    if (structuredData) {
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach((script) => script.remove());
      const schemaArray = Array.isArray(structuredData) ? structuredData : [structuredData];
      schemaArray.forEach((schema, index) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(schema, null, 2);
        script.id = `structured-data-${index}`;
        document.head.appendChild(script);
      });
    }
  }, [
    fullTitle,
    fullDescription,
    allKeywords,
    fullCanonicalUrl,
    fullOgImage,
    ogType,
    structuredData,
    noIndex
  ]);
  return null;
}
function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "eYogi Gurukul",
    description: "Premier online platform for authentic Hindu education, Vedic learning, and Sanatan Dharma studies. Learn Sanskrit, Hindu philosophy, mantras, yoga, and traditional Hindu culture through expert-led courses.",
    url: "https://eyogi-gurukul.vercel.app",
    logo: "/Images/Logo.png",
    sameAs: [
      "https://facebook.com/eyogigurukul",
      "https://twitter.com/eyogigurukul",
      "https://youtube.com/eyogigurukul",
      "https://instagram.com/eyogigurukul"
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Dublin Technology Centre",
      addressLocality: "Dublin",
      addressCountry: "Ireland"
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+353-1-234-5678",
      contactType: "Customer Service",
      email: "info@eyogigurukul.com"
    },
    foundingDate: "2024",
    keywords: "Hindu Education, Vedic Learning, Sanatan Dharma, Sanskrit, Hindu Philosophy, Yoga, Mantras, Hindu Culture, Traditional Hindu Education, Online Gurukul",
    educationalCredentialAwarded: "Certificate of Completion in Vedic Studies",
    hasCredential: [
      "Hindu Philosophy Certification",
      "Sanskrit Language Proficiency",
      "Mantra Studies Certificate",
      "Yoga Teacher Training",
      "Vedic Studies Diploma"
    ]
  };
}
function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "eYogi Gurukul - Hindu Education & Vedic Learning Platform",
    description: "Comprehensive online platform for authentic Hindu education, Vedic studies, and Sanatan Dharma learning. Expert-led courses in Sanskrit, Hindu philosophy, mantras, yoga, and traditional Hindu culture.",
    url: "https://eyogi-gurukul.vercel.app",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://eyogi-gurukul.vercel.app/courses?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    keywords: "Hindu Education, Hinduism Learning, Vedic Studies, Sanatan Dharma, Hindu Philosophy, Sanskrit Learning, Hindu Culture, Indian Hindu Traditions, Hindu Religion Online, Vedic Wisdom, Hindu Gurukul, Traditional Hindu Education",
    inLanguage: ["en", "hi", "sa"],
    about: [
      { "@type": "Thing", name: "Hindu Religion" },
      { "@type": "Thing", name: "Hinduism" },
      { "@type": "Thing", name: "Vedic Philosophy" },
      { "@type": "Thing", name: "Sanatan Dharma" },
      { "@type": "Thing", name: "Hindu Culture" },
      { "@type": "Thing", name: "Indian Hindu Culture" },
      { "@type": "Thing", name: "Sanskrit Language" },
      { "@type": "Thing", name: "Hindu Education" },
      { "@type": "Thing", name: "Vedic Learning" },
      { "@type": "Thing", name: "Hindu Traditions" }
    ]
  };
}
function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://eyogi-gurukul.vercel.app${item.url}`
    }))
  };
}
function RollingText({ text, className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rolling-text-container ${className}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rolling-text", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rolling-text-item", children: text }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rolling-text-item", children: text })
  ] }) });
}
function Footer() {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const footerSections = [
    {
      title: "Gurukuls",
      links: [
        { name: "Hinduism Gurukul", href: "/gurukuls/hinduism" },
        { name: "Mantra Gurukul", href: "/gurukuls/mantra" },
        { name: "Philosophy Gurukul", href: "/gurukuls/philosophy" },
        { name: "Sanskrit Gurukul", href: "/gurukuls/sanskrit" },
        { name: "Yoga & Wellness", href: "/gurukuls/yoga-wellness" }
      ]
    },
    {
      title: "Learning",
      links: [
        { name: "All Courses", href: "/courses" },
        { name: "Elementary (4-7)", href: "/courses?level=elementary" },
        { name: "Basic (8-11)", href: "/courses?level=basic" },
        { name: "Intermediate (12-15)", href: "/courses?level=intermediate" },
        { name: "Advanced (16-19)", href: "/courses?level=advanced" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Contact Us", href: "/contact" },
        { name: "FAQ", href: "/faq" },
        { name: "Community", href: "/community" },
        { name: "Blog", href: "/blog" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "Accessibility", href: "/accessibility" }
      ]
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "bg-gray-900 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:col-span-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-sm", children: "eY" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold", children: "eYogi Gurukul" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-300 text-sm mb-4", children: "Connecting ancient Vedic wisdom with modern learning through comprehensive online education." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex space-x-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#", className: "text-gray-400 hover:text-white transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Facebook" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fillRule: "evenodd", d: "M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z", clipRule: "evenodd" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#", className: "text-gray-400 hover:text-white transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Twitter" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#", className: "text-gray-400 hover:text-white transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "YouTube" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fillRule: "evenodd", d: "M2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10ZM10 4C6.68629 4 4 6.68629 4 10C4 13.3137 6.68629 16 10 16C13.3137 16 16 13.3137 16 10C16 6.68629 13.3137 4 10 4Z", clipRule: "evenodd" }) })
          ] })
        ] })
      ] }),
      footerSections.map((section) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-white uppercase tracking-wider mb-4", children: section.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: section.links.map((link) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: link.href,
            className: "text-gray-300 hover:text-white text-sm transition-colors",
            children: link.name
          }
        ) }, link.name)) })
      ] }, section.title))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 pt-8 border-t border-gray-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-400 text-sm", children: [
        "© ",
        currentYear,
        " eYogi Gurukul. All rights reserved."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm mt-2 md:mt-0", children: "Made with ❤️ for preserving ancient wisdom" })
    ] }) })
  ] }) });
}
function HomePage() {
  const structuredData = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Hindu Education & Vedic Learning Platform - eYogi Gurukul",
      description: "Discover authentic Hindu traditions, Vedic philosophy, Sanskrit, mantras, and yoga through expert-led online courses. Join our global community of Sanatan Dharma learners.",
      url: "https://eyogi-gurukul.vercel.app",
      mainEntity: {
        "@type": "EducationalOrganization",
        name: "eYogi Gurukul"
      },
      about: [
        { "@type": "Thing", name: "Hindu Religion" },
        { "@type": "Thing", name: "Hinduism" },
        { "@type": "Thing", name: "Vedic Philosophy" },
        { "@type": "Thing", name: "Sanatan Dharma" },
        { "@type": "Thing", name: "Hindu Culture" },
        { "@type": "Thing", name: "Indian Hindu Culture" }
      ]
    }
  ];
  const features = [
    {
      icon: ForwardRef$3,
      title: "Expert Teachers",
      description: "Learn from qualified instructors with deep knowledge of Vedic traditions"
    },
    {
      icon: ForwardRef$4,
      title: "Comprehensive Curriculum",
      description: "Structured courses covering all aspects of ancient wisdom and modern applications"
    },
    {
      icon: ForwardRef$5,
      title: "Community Learning",
      description: "Join a global community of learners on the path of spiritual growth"
    },
    {
      icon: ForwardRef$6,
      title: "Certified Programs",
      description: "Earn certificates upon completion of courses and showcase your achievements"
    }
  ];
  const gurukuls = [
    {
      name: "Hinduism Gurukul",
      description: "Explore Hindu traditions, philosophy, and practices",
      image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop",
      courses: 12,
      students: 450,
      slug: "hinduism"
    },
    {
      name: "Mantra Gurukul",
      description: "Learn sacred mantras and their transformative power",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      courses: 8,
      students: 320,
      slug: "mantra"
    },
    {
      name: "Philosophy Gurukul",
      description: "Dive deep into ancient philosophical traditions",
      image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
      courses: 15,
      students: 280,
      slug: "philosophy"
    },
    {
      name: "Sanskrit Gurukul",
      description: "Master the sacred language of Sanskrit",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop",
      courses: 10,
      students: 380,
      slug: "sanskrit"
    },
    {
      name: "Yoga & Wellness",
      description: "Integrate physical, mental, and spiritual wellness",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
      courses: 18,
      students: 520,
      slug: "yoga-wellness"
    }
  ];
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Student, Philosophy Gurukul",
      content: "The depth of knowledge and the way it's presented makes ancient wisdom accessible to modern minds.",
      rating: 5
    },
    {
      name: "Raj Patel",
      role: "Parent",
      content: "My daughter has learned so much about our culture and traditions. The teachers are excellent.",
      rating: 5
    },
    {
      name: "Maria Garcia",
      role: "Student, Yoga Gurukul",
      content: "The holistic approach to wellness has transformed my daily practice and understanding.",
      rating: 5
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SEOHead,
      {
        title: "Hindu Education & Vedic Learning Platform",
        description: "Learn authentic Hindu traditions, Vedic philosophy, Sanskrit, mantras, and yoga through comprehensive online courses. Discover Sanatan Dharma wisdom with expert teachers in our traditional Gurukul system.",
        keywords: [
          "Hindu Education Online",
          "Vedic Learning Platform",
          "Sanatan Dharma Courses",
          "Hindu Philosophy Online",
          "Sanskrit Learning Online",
          "Hindu Culture Education",
          "Indian Hindu Traditions",
          "Vedic Wisdom Courses",
          "Hindu Gurukul Online",
          "Traditional Hindu Education",
          "Authentic Hindu Teaching",
          "Hindu Heritage Learning",
          "Vedic Studies Online",
          "Hindu Spiritual Education",
          "Dharma Education Platform",
          "Hindu Values Learning",
          "Vedic Knowledge Online",
          "Hindu Religion Courses"
        ],
        canonicalUrl: "/",
        structuredData
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RollingText, { text: "🕉️ Spirituality and Science of Hinduism University - Discover Ancient Wisdom Through Modern Learning 🕉️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "section",
        {
          id: "hero",
          className: "relative bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-hidden hero-section",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-white/40 via-white/20 to-white/30 backdrop-blur-md" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-orange-100/50 via-orange-50/30 to-red-100/40 backdrop-blur-sm" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-200/30 via-orange-100/20 to-transparent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 backdrop-blur-[2px] bg-white/15" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative container-max section-padding", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-8 lg:gap-12 items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 lg:space-y-8 text-center lg:text-left", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 px-4 sm:px-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center lg:justify-start badge-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "info",
                      className: "text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 hero-badge",
                      children: "🕉️ Authentic Hindu Education & Vedic Learning"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "h1",
                    {
                      className: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-2 sm:px-0",
                      itemProp: "headline",
                      children: [
                        "Learn Authentic ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gradient-text", children: "Hindu Heritage" }),
                        " & Vedic Wisdom"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      className: "text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed px-2 sm:px-0",
                      itemProp: "description",
                      children: "Discover authentic Hindu religion, Vedic philosophy, Sanskrit, mantras, and yoga through our comprehensive Sanatan Dharma education platform. Learn traditional Hindu culture from expert teachers in our modern Gurukul system designed for all ages."
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:gap-4 px-4 sm:px-0 sm:flex-row justify-center lg:justify-start", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollLink, { to: "/courses", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      size: "lg",
                      className: "w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3",
                      children: [
                        "Explore Courses",
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$1, { className: "ml-2 h-5 w-5" })
                      ]
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollLink, { to: "/gurukuls", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "primary",
                      size: "lg",
                      className: "w-full sm:w-auto min-h-[50px] text-base font-semibold px-6 py-3",
                      children: "Browse Gurukuls"
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-center sm:space-x-6 lg:space-x-8 text-sm text-gray-600 justify-center lg:justify-start px-2 sm:px-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 justify-center lg:justify-start", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm sm:text-sm font-medium", children: "1,950+ Students" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 justify-center lg:justify-start", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm sm:text-sm font-medium", children: "63+ Courses" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 justify-center lg:justify-start", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$2, { className: "h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm sm:text-sm font-medium", children: "5 Gurukuls" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative order-first lg:order-last overflow-visible", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "aspect-square max-w-sm mx-auto lg:max-w-none rounded-2xl overflow-hidden shadow-2xl bg-white/30 backdrop-blur-lg border border-white/40 p-4 relative", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: "/ssh-app/Images/Logo.png",
                      alt: "eYogi Gurukul logo",
                      className: "w-full h-full object-contain logo-pop relative z-10"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -bottom-4 left-2 sm:-left-4 lg:-bottom-6 lg:-left-6 bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-3 lg:p-4 border border-white/30 hero-certificate-card", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-lg" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex items-center space-x-2 lg:space-x-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 lg:h-12 lg:w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$3, { className: "h-5 w-5 lg:h-6 lg:w-6 text-white" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900 text-sm lg:text-base", children: "Certified Hindu Education" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs lg:text-sm text-gray-600", children: "Authentic Vedic Learning" })
                    ] })
                  ] })
                ] })
              ] })
            ] }) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "courses", className: "section-padding bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12 lg:mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl sm:text-3xl md:text-4xl font-bold mb-4", children: "Why Choose eYogi Gurukul for Hindu Education?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4", children: "We bridge the gap between ancient Hindu wisdom and modern learning technology, making authentic Vedic knowledge and Sanatan Dharma accessible to everyone, everywhere." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8", children: features.map((feature, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "card-hover text-center glass-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 lg:pt-8 px-4 lg:px-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 lg:h-16 lg:w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(feature.icon, { className: "h-6 w-6 lg:h-8 lg:w-8 text-white" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg lg:text-xl font-semibold mb-2", children: feature.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm lg:text-base", children: feature.description })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "gurukuls", className: "section-padding bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12 lg:mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl sm:text-3xl md:text-4xl font-bold mb-4", children: "Explore Our Traditional Hindu Gurukuls" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4", children: "Each Hindu Gurukul specializes in different aspects of Vedic knowledge and Sanatan Dharma, offering comprehensive Hindu education paths for students of all ages." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8", children: gurukuls.map((gurukul, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-hover overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: gurukul.image,
              alt: `${gurukul.name} - Traditional Hindu education and Vedic learning center`,
              className: "w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4 lg:p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg lg:text-xl font-semibold mb-2", children: gurukul.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-4 text-sm lg:text-base", children: gurukul.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-4 text-xs lg:text-sm text-gray-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                gurukul.courses,
                " Hindu Courses"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                gurukul.students,
                " Vedic Students"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollLink, { to: `/gurukuls/${gurukul.slug}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "primary", className: "w-full min-h-[44px]", children: "Explore Hindu Gurukul" }) })
          ] })
        ] }, index)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "about", className: "section-padding bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "What Our Hindu Education Students Say" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600", children: "Hear from our global community of Hindu and Vedic learning students" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-3 gap-8", children: testimonials.map((testimonial, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "card-hover", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex mb-4", children: [...Array(testimonial.rating)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$6, { className: "h-5 w-5 text-yellow-400 fill-current" }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-600 mb-4 italic", children: [
            '"',
            testimonial.content,
            '"'
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: testimonial.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500", children: [
              "Hindu Education ",
              testimonial.role
            ] })
          ] })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "contact", className: "section-padding gradient-bg text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl sm:text-3xl md:text-4xl font-bold mb-4 px-4", children: "Begin Your Hindu Education Journey Today" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base sm:text-lg lg:text-xl mb-6 lg:mb-8 opacity-90 max-w-2xl mx-auto px-4 leading-relaxed", children: "Join thousands of students worldwide in discovering the timeless wisdom of Hindu traditions and Vedic philosophy through our comprehensive Sanatan Dharma courses." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center max-w-sm sm:max-w-none mx-auto px-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollLink, { to: "/auth/signup", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "secondary",
              size: "lg",
              className: "bg-white text-orange-600 hover:bg-gray-100 w-full sm:w-auto min-h-[50px] font-semibold text-base px-6 py-3",
              children: "Start Hindu Learning Free"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollLink, { to: "/courses", className: "w-full sm:w-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "lg",
              className: "border-white text-white hover:bg-white hover:text-orange-600 w-full sm:w-auto min-h-[50px] font-semibold text-base px-6 py-3",
              children: "Browse Hindu Courses"
            }
          ) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
function AboutPage() {
  const values = [
    {
      icon: ForwardRef$7,
      title: "Authentic Wisdom",
      description: "We preserve and share the authentic teachings of Sanatana Dharma with respect and accuracy."
    },
    {
      icon: ForwardRef$8,
      title: "Global Harmony",
      description: "Building bridges between ancient wisdom and modern life to create peace and understanding."
    },
    {
      icon: ForwardRef$5,
      title: "Inclusive Learning",
      description: "Welcoming learners from all backgrounds to explore and benefit from Vedic knowledge."
    },
    {
      icon: ForwardRef$3,
      title: "Excellence in Education",
      description: "Providing high-quality, structured learning experiences with certified instructors."
    }
  ];
  const team = [
    {
      name: "Dr. Rajesh Sharma",
      role: "Founder & Chief Academic Officer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      bio: "PhD in Sanskrit Studies with 20+ years of teaching experience in Vedic philosophy."
    },
    {
      name: "Priya Patel",
      role: "Director of Curriculum",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      bio: "Master in Hindu Philosophy, specializing in age-appropriate spiritual education."
    },
    {
      name: "Arjun Kumar",
      role: "Technology Director",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      bio: "Expert in educational technology with a passion for making ancient wisdom accessible."
    }
  ];
  const stats = [
    { number: "1,950+", label: "Students Worldwide" },
    { number: "63+", label: "Courses Available" },
    { number: "5", label: "Specialized Gurukuls" },
    { number: "25+", label: "Expert Teachers" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SEOHead,
      {
        title: "About eYogi Gurukul - Hindu Education & Vedic Learning Mission",
        description: "Discover eYogi Gurukul's mission to connect ancient Hindu wisdom with modern learning. Learn about our authentic Vedic education approach, expert teachers, and global community of Sanatan Dharma learners.",
        keywords: [
          "About eYogi Gurukul",
          "Hindu Education Mission",
          "Vedic Learning Philosophy",
          "Sanatan Dharma Education",
          "Hindu Culture Preservation",
          "Vedic Wisdom Sharing",
          "Traditional Hindu Education",
          "Authentic Hindu Teaching",
          "Hindu Heritage Mission",
          "Vedic Knowledge Preservation",
          "Hindu Spiritual Education",
          "Dharma Education Mission",
          "Hindu Values Teaching",
          "Indian Hindu Culture Education",
          "Vedic Tradition Learning"
        ],
        canonicalUrl: "/about",
        structuredData: [
          generateBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "About Hindu Education", url: "/about" }
          ]),
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About eYogi Gurukul - Hindu Education Mission",
            description: "Learn about eYogi Gurukul's mission to preserve and share authentic Hindu wisdom through modern educational technology.",
            url: "https://eyogi-gurukul.vercel.app/about",
            mainEntity: {
              "@type": "EducationalOrganization",
              name: "eYogi Gurukul",
              mission: "To connect ancient Hindu wisdom with modern learning technology, creating eYogis who bridge spiritual science with contemporary life."
            },
            about: [
              { "@type": "Thing", name: "Hindu Education" },
              { "@type": "Thing", name: "Vedic Learning" },
              { "@type": "Thing", name: "Sanatan Dharma" },
              { "@type": "Thing", name: "Hindu Culture Preservation" }
            ]
          }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50 page-with-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "bg-gradient-to-r from-orange-50 to-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max section-padding", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-4xl md:text-6xl font-bold text-gray-900 mb-6", children: [
          "About ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gradient-text", children: "eYogi Gurukul" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 leading-relaxed mb-8", children: 'The "e" in "eYogi Gurukul" connects the ancient Vedic practices of meditation and Spirituality of Hinduism to the modern world of science and globalization. We are dedicated to preserving and sharing the timeless wisdom of Sanatana Dharma through innovative online education.' }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "lg", children: "Explore Our Courses" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "lg", children: "Get in Touch" }) })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-6", children: "Our Mission" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-gray-600 mb-6", children: 'An "eYogi" is a practitioner of meditation and Spirituality who connects the ancient science and Spirituality of Sanatana Dharma (Eternal Laws that govern the inner world) to the modern world. eYogis respect other cultures and embrace integration to build peace and harmony in the world.' }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-gray-600 mb-8", children: "We believe that ancient wisdom has profound relevance in today's world, offering solutions to modern challenges through time-tested principles of dharma, meditation, and spiritual growth." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "h-6 w-6 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900", children: "Bridging Ancient & Modern" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Connecting timeless wisdom with contemporary life" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: "/ssh-app/Images/Logo.png",
            alt: "eYogi Gurukul logo - Ancient wisdom meets modern learning",
            className: "rounded-2xl shadow-2xl object-contain bg-white p-6 logo-pop"
          }
        ) })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding gradient-bg text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Our Impact" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl opacity-90", children: "Growing community of learners worldwide" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-4 gap-8", children: stats.map((stat, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl md:text-5xl font-bold mb-2", children: stat.number }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg opacity-90", children: stat.label })
        ] }, index)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: "Our Values" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "The principles that guide our mission to share Vedic wisdom with the world" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-8", children: values.map((value, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "text-center card-hover", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(value.icon, { className: "h-8 w-8 text-white" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-2", children: value.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: value.description })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: "Meet Our Team" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Dedicated educators and technologists committed to sharing ancient wisdom" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-3 gap-8", children: team.map((member, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "text-center card-hover", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 rounded-full overflow-hidden mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: member.image,
              alt: member.name,
              className: "w-full h-full object-cover"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-1", children: member.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-orange-600 font-medium mb-3", children: member.role }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm", children: member.bio })
        ] }) }, index)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-6", children: "Our Vision for the Future" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg text-gray-600 mb-8", children: "We envision a world where ancient wisdom and modern knowledge work together to create a more peaceful, harmonious, and spiritually aware global community. Through education, we aim to bridge cultural divides and foster understanding between different traditions and ways of life." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-3 gap-8 mt-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$8, { className: "h-6 w-6 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-2", children: "Global Reach" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm", children: "Making Vedic wisdom accessible to learners worldwide" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$6, { className: "h-6 w-6 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-2", children: "Excellence" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm", children: "Maintaining the highest standards in spiritual education" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$7, { className: "h-6 w-6 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-2", children: "Compassion" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm", children: "Teaching with love, respect, and understanding" })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding gradient-bg text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Join Our Community" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl mb-8 opacity-90 max-w-2xl mx-auto", children: "Become part of a global community dedicated to learning, growing, and sharing the timeless wisdom of Vedic traditions." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth/signup", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "secondary",
              size: "lg",
              className: "bg-white text-orange-600 hover:bg-gray-100",
              children: "Start Learning Today"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/gurukuls", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "primary", size: "lg", children: "Explore Gurukuls" }) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
const contactSchema = objectType({
  name: stringType().min(2, "Name must be at least 2 characters"),
  email: stringType().email("Please enter a valid email address"),
  subject: stringType().min(5, "Subject must be at least 5 characters"),
  message: stringType().min(10, "Message must be at least 10 characters"),
  type: enumType(["general", "course", "technical", "partnership"])
});
function ContactPage() {
  var _a, _b, _c;
  const [loading, setLoading] = reactExports.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: t(contactSchema),
    defaultValues: {
      type: "general"
    }
  });
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      zt.success("Message sent successfully! We'll get back to you soon.");
      reset();
    } catch (error) {
      zt.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const contactInfo = [
    {
      icon: ForwardRef$9,
      title: "Email Us",
      details: "info@eyogigurukul.com",
      description: "Send us an email anytime"
    },
    {
      icon: ForwardRef$a,
      title: "Call Us",
      details: "+353 1 234 5678",
      description: "Mon-Fri 9AM-6PM IST"
    },
    {
      icon: ForwardRef$b,
      title: "Visit Us",
      details: "Dublin, Ireland",
      description: "European Headquarters"
    },
    {
      icon: ForwardRef$c,
      title: "Support Hours",
      details: "24/7 Online",
      description: "AI chatbot always available"
    }
  ];
  const faqItems = [
    {
      question: "How do I enroll in a course?",
      answer: 'Create an account, browse our courses, and click "Enroll Now" on any course page. Payment and approval processes will guide you through the rest.'
    },
    {
      question: "Are courses suitable for beginners?",
      answer: "Yes! We offer courses for all levels, from elementary (ages 4-7) to advanced (ages 16-19). Each course clearly indicates its level and prerequisites."
    },
    {
      question: "Do I get a certificate upon completion?",
      answer: "Yes, all students receive a digital certificate upon successful completion of their courses. Certificates include verification codes for authenticity."
    },
    {
      question: "Can I access courses from anywhere in the world?",
      answer: "Absolutely! Our online courses are accessible globally. We also offer some hybrid and in-person options in select locations."
    },
    {
      question: "What if I need help during a course?",
      answer: "Our teachers and support team are always available. You can message instructors directly, use our AI chatbot, or contact support anytime."
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SEOHead,
      {
        title: "Contact eYogi Gurukul - Hindu Education Support & Information",
        description: "Contact eYogi Gurukul for questions about Hindu courses, Vedic education, enrollment, or Sanatan Dharma learning. Get support for your spiritual education journey.",
        keywords: [
          "Contact Hindu Education",
          "eYogi Gurukul Contact",
          "Hindu Course Support",
          "Vedic Learning Help",
          "Sanatan Dharma Questions",
          "Hindu Education Support",
          "Gurukul Contact Information",
          "Hindu Course Enrollment Help",
          "Vedic Education Inquiry",
          "Hindu Learning Support",
          "Traditional Hindu Education Contact",
          "Hindu Culture Questions"
        ],
        canonicalUrl: "/contact",
        structuredData: [
          generateBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Contact Hindu Education Support", url: "/contact" }
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contact eYogi Gurukul",
            description: "Get in touch with eYogi Gurukul for Hindu education support, course information, and Vedic learning assistance.",
            url: "https://eyogi-gurukul.vercel.app/contact",
            mainEntity: {
              "@type": "ContactPoint",
              telephone: "+353-1-234-5678",
              email: "info@eyogigurukul.com",
              contactType: "Customer Service",
              availableLanguage: ["English", "Hindi"]
            }
          }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50 page-with-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "bg-gradient-to-r from-orange-50 to-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max section-padding", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-4xl md:text-6xl font-bold text-gray-900 mb-6", children: [
          "Get in ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gradient-text", children: "Touch" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 leading-relaxed mb-8", children: "Have questions about our courses, need technical support, or want to learn more about eYogi Gurukul? We're here to help you on your learning journey." })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16", children: contactInfo.map((info, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "text-center card-hover", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(info.icon, { className: "h-8 w-8 text-white" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold mb-2", children: info.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-orange-600 font-medium mb-1", children: info.details }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm", children: info.description })
      ] }) }, index)) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2 gap-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$d, { className: "h-6 w-6 text-orange-600" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Send us a Message" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Fill out the form below and we'll get back to you as soon as possible." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  label: "Full Name",
                  ...register("name"),
                  error: (_a = errors.name) == null ? void 0 : _a.message
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  label: "Email Address",
                  type: "email",
                  ...register("email"),
                  error: (_b = errors.email) == null ? void 0 : _b.message
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Inquiry Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  ...register("type"),
                  className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "general", children: "General Inquiry" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "course", children: "Course Information" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "technical", children: "Technical Support" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "partnership", children: "Partnership" })
                  ]
                }
              ),
              errors.type && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: errors.type.message })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                label: "Subject",
                ...register("subject"),
                error: (_c = errors.subject) == null ? void 0 : _c.message
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Message" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  ...register("message"),
                  rows: 5,
                  className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3",
                  placeholder: "Tell us how we can help you..."
                }
              ),
              errors.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-600", children: errors.message.message })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", loading, children: "Send Message" })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3 mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$e, { className: "h-6 w-6 text-orange-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "Frequently Asked Questions" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: faqItems.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "card-hover", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: item.question }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm", children: item.answer })
          ] }) }, index)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: "Need Immediate Help?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Our AI chatbot is available 24/7 to answer common questions and provide instant support." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", children: "Chat with AI Assistant" })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding gradient-bg text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Ready to Start Learning?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl mb-8 opacity-90 max-w-2xl mx-auto", children: "Don't wait! Join thousands of students worldwide in discovering the timeless wisdom of Vedic traditions." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "secondary",
              size: "lg",
              className: "bg-white text-orange-600 hover:bg-gray-100",
              children: "Browse Courses"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "lg",
              className: "border-white text-white hover:bg-white hover:text-orange-600",
              children: "Create Account"
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
function CoursesPage() {
  const [courses, setCourses] = reactExports.useState([]);
  const [gurukuls, setGurukuls] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [selectedGurukul, setSelectedGurukul] = reactExports.useState("");
  const [selectedLevel, setSelectedLevel] = reactExports.useState("");
  const [ageGroup, setAgeGroup] = reactExports.useState("");
  reactExports.useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const [coursesData, gurukulData] = await Promise.all([getCourses(), getGurukuls()]);
      setCourses(coursesData);
      setGurukuls(gurukulData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGurukul = !selectedGurukul || course.gurukul_id === selectedGurukul;
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    const matchesAge = !ageGroup || course.age_group_min <= parseInt(ageGroup) && course.age_group_max >= parseInt(ageGroup);
    return matchesSearch && matchesGurukul && matchesLevel && matchesAge;
  });
  const levels = [
    { value: "elementary", label: "Elementary (4-7 years)" },
    { value: "basic", label: "Basic (8-11 years)" },
    { value: "intermediate", label: "Intermediate (12-15 years)" },
    { value: "advanced", label: "Advanced (16-19 years)" }
  ];
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner w-8 h-8 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Loading courses..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SEOHead,
      {
        title: "Hindu Courses & Vedic Education Programs",
        description: "Explore comprehensive Hindu education courses covering Vedic philosophy, Sanskrit, mantras, yoga, and Sanatan Dharma. Expert-led online classes for all age groups from traditional Gurukuls.",
        keywords: [
          "Hindu Courses Online",
          "Vedic Education Programs",
          "Sanatan Dharma Classes",
          "Hindu Philosophy Courses",
          "Sanskrit Courses Online",
          "Hindu Culture Classes",
          "Vedic Studies Courses",
          "Hindu Religion Education",
          "Traditional Hindu Learning",
          "Hindu Spiritual Courses",
          "Dharma Education Classes",
          "Hindu Heritage Courses",
          "Vedic Wisdom Programs",
          "Hindu Online Classes",
          "Indian Hindu Education",
          "Hindu Gurukul Courses",
          "Authentic Hindu Teaching",
          "Hindu Values Education"
        ],
        canonicalUrl: "/courses",
        structuredData: [
          generateBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Hindu Courses & Vedic Education", url: "/courses" }
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Hindu Courses & Vedic Education Programs",
            description: "Comprehensive collection of Hindu education courses covering Vedic philosophy, Sanskrit, mantras, yoga, and Sanatan Dharma traditions.",
            url: "https://eyogi-gurukul.vercel.app/courses",
            mainEntity: {
              "@type": "ItemList",
              name: "Hindu Education Courses",
              description: "Expert-led courses in Hindu traditions and Vedic learning"
            }
          }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50 page-with-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max section-padding", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Explore Our Courses" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Discover comprehensive courses in Vedic wisdom, designed for learners of all ages. From ancient philosophy to practical applications in modern life." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$f, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" }),
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
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: selectedGurukul,
                onChange: (e) => setSelectedGurukul(e.target.value),
                className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All Gurukuls" }),
                  gurukuls.map((gurukul) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: gurukul.id, children: gurukul.name }, gurukul.id))
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: selectedLevel,
                onChange: (e) => setSelectedLevel(e.target.value),
                className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All Levels" }),
                  levels.map((level) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: level.value, children: level.label }, level.value))
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                placeholder: "Your age",
                value: ageGroup,
                onChange: (e) => setAgeGroup(e.target.value),
                min: "4",
                max: "100",
                className: "block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-base px-4 py-3"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600", children: [
              "Showing ",
              filteredCourses.length,
              " of ",
              courses.length,
              " courses"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => {
                  setSearchTerm("");
                  setSelectedGurukul("");
                  setSelectedLevel("");
                  setAgeGroup("");
                },
                children: "Clear Filters"
              }
            )
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max section-padding", children: filteredCourses.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$g, { className: "h-12 w-12 text-gray-400 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No courses found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Try adjusting your filters to see more courses." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8", children: filteredCourses.map((course) => {
        var _a;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-hover overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-lg", children: course.course_number.slice(-2) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-700", children: (_a = course.gurukul) == null ? void 0 : _a.name })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: getLevelColor(course.level), children: course.level }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-500", children: course.course_number })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-2 line-clamp-2", children: course.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-4 line-clamp-3", children: course.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mb-4 text-sm text-gray-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "h-4 w-4 mr-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Ages ",
                  getAgeGroupLabel(course.age_group_min, course.age_group_max)
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$c, { className: "h-4 w-4 mr-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  course.duration_weeks,
                  " weeks"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$h, { className: "h-4 w-4 mr-2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCurrency(course.fee) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-500", children: [
                course.delivery_method === "remote" && "🌐 Online",
                course.delivery_method === "physical" && "🏫 In-person",
                course.delivery_method === "hybrid" && "🔄 Hybrid"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: `/courses/${course.id}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", children: "View Details" }) })
            ] })
          ] })
        ] }, course.id);
      }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
function GurukulPage() {
  const [gurukuls, setGurukuls] = reactExports.useState([]);
  const [courseCounts, setCourseCounts] = reactExports.useState({});
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const [gurukulData, coursesData] = await Promise.all([getGurukuls(), getCourses()]);
      setGurukuls(gurukulData);
      const counts = {};
      coursesData.forEach((course) => {
        counts[course.gurukul_id] = (counts[course.gurukul_id] || 0) + 1;
      });
      setCourseCounts(counts);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner w-8 h-8 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Loading Gurukuls..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SEOHead,
      {
        title: "Hindu Gurukuls - Traditional Vedic Learning Centers",
        description: "Explore our 5 specialized Hindu Gurukuls offering authentic Vedic education: Hinduism, Mantra, Philosophy, Sanskrit, and Yoga & Wellness. Traditional Gurukul system meets modern online learning.",
        keywords: [
          "Hindu Gurukul Online",
          "Vedic Learning Centers",
          "Traditional Hindu Education",
          "Sanatan Dharma Gurukuls",
          "Hindu Philosophy Gurukul",
          "Sanskrit Gurukul Online",
          "Mantra Gurukul",
          "Yoga Gurukul",
          "Hindu Culture Gurukul",
          "Vedic Education Centers",
          "Authentic Hindu Gurukul",
          "Indian Gurukul System",
          "Hindu Heritage Centers",
          "Vedic Wisdom Gurukuls",
          "Hindu Spiritual Centers",
          "Traditional Hindu Schools"
        ],
        canonicalUrl: "/gurukuls",
        structuredData: [
          generateBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Hindu Gurukuls", url: "/gurukuls" }
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Hindu Gurukuls - Traditional Vedic Learning Centers",
            description: "Collection of specialized Hindu Gurukuls offering authentic Vedic education in Hinduism, Sanskrit, Philosophy, Mantras, and Yoga.",
            url: "https://eyogi-gurukul.vercel.app/gurukuls",
            mainEntity: {
              "@type": "ItemList",
              name: "Hindu Gurukuls",
              numberOfItems: 5,
              itemListElement: [
                { "@type": "EducationalOrganization", name: "Hinduism Gurukul" },
                { "@type": "EducationalOrganization", name: "Mantra Gurukul" },
                { "@type": "EducationalOrganization", name: "Philosophy Gurukul" },
                { "@type": "EducationalOrganization", name: "Sanskrit Gurukul" },
                { "@type": "EducationalOrganization", name: "Yoga & Wellness Gurukul" }
              ]
            }
          }
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50 page-with-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "bg-gradient-to-r from-orange-50 to-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max section-padding", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-4xl md:text-6xl font-bold text-gray-900 mb-6", children: [
          "Explore Our ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gradient-text", children: "Gurukuls" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 leading-relaxed mb-8", children: "Each Gurukul specializes in different aspects of Vedic knowledge, offering comprehensive learning paths designed for students of all ages. Discover ancient wisdom through modern, interactive education." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center space-x-8 text-sm text-gray-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "h-5 w-5 text-orange-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "5 Specialized Gurukuls" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$3, { className: "h-5 w-5 text-orange-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "63+ Courses" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "h-5 w-5 text-orange-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "1,950+ Students" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-3", children: gurukuls.map((gurukul) => /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollLink, { to: `/gurukuls/${gurukul.slug}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "primary",
              size: "sm",
              "aria-label": `Explore ${gurukul.name} Gurukul`,
              className: "shadow-sm",
              children: gurukul.name
            }
          ) }, gurukul.id)) })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-max", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8", children: gurukuls.map((gurukul) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "card-hover overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-video overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: gurukul.image_url || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop`,
            alt: gurukul.name,
            className: "w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-3", children: gurukul.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mb-4 line-clamp-3", children: gurukul.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6 text-sm text-gray-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                courseCounts[gurukul.id] || 0,
                " Courses"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Active Learning" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollLink, { to: `/gurukuls/${gurukul.slug}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full", children: [
            "Explore Gurukul",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$1, { className: "ml-2 h-4 w-4" })
          ] }) })
        ] })
      ] }, gurukul.id)) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold text-gray-900 mb-4", children: "Why Choose Our Gurukuls?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Our specialized approach ensures deep, authentic learning in each domain of Vedic knowledge." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-3 gap-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "h-8 w-8 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-2", children: "Specialized Curriculum" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Each Gurukul offers focused, in-depth study of specific aspects of Vedic knowledge." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$5, { className: "h-8 w-8 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-2", children: "Expert Teachers" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Learn from qualified instructors with deep knowledge and authentic understanding." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$3, { className: "h-8 w-8 text-white" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-semibold mb-2", children: "Certified Learning" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Earn certificates upon completion and showcase your achievements in Vedic studies." })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "section-padding gradient-bg text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container-max text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Ready to Begin Your Journey?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl mb-8 opacity-90 max-w-2xl mx-auto", children: "Choose your path of learning and connect with the timeless wisdom of Vedic traditions." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/courses", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "secondary",
              size: "lg",
              className: "bg-white text-orange-600 hover:bg-gray-100",
              children: "Browse All Courses"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth/signup", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "lg",
              className: "border-white text-white hover:bg-white hover:text-orange-600",
              children: "Create Account"
            }
          ) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Footer, {})
  ] });
}
const AdminLogin = () => {
  const { signIn, loading, isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [showPassword, setShowPassword] = reactExports.useState(false);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const navigationAttempted = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (!loading && user && isSuperAdmin && !navigationAttempted.current) {
      navigationAttempted.current = true;
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, isSuperAdmin, loading, navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        zt.error(error.message || "Login failed");
        return;
      }
      zt.success("Welcome to Admin Console");
    } catch (error) {
      zt.error("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-md w-full space-y-8 p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "eYogi Gurukul SSH University" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Admin Console" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-2", children: "Email Address" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            id: "email",
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            placeholder: "admin@eyogi.com"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-2", children: "Password" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              id: "password",
              type: showPassword ? "text" : "password",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              required: true,
              className: "w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              placeholder: "Enter your password"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowPassword(!showPassword),
              className: "absolute inset-y-0 right-0 pr-3 flex items-center",
              children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$i, { className: "h-5 w-5 text-gray-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$j, { className: "h-5 w-5 text-gray-400" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "submit",
          disabled: isLoading,
          className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
          children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }),
            "Signing in..."
          ] }) : "Sign in to Admin Console"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: "Admin access only. Contact support if you need assistance." }) })
  ] }) }) });
};
const AdminSidebar = ({ isOpen, onClose }) => {
  var _a, _b, _c, _d;
  const { profile, canAccess, user, signOut } = useAuth();
  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: ForwardRef$k,
      permission: null
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: ForwardRef$l,
      permission: { resource: "users", action: "read" }
    },
    {
      name: "Courses",
      href: "/admin/courses",
      icon: ForwardRef$4,
      permission: { resource: "courses", action: "read" }
    },
    {
      name: "Enrollments",
      href: "/admin/enrollments",
      icon: ForwardRef$m,
      permission: { resource: "enrollments", action: "read" }
    },
    {
      name: "Certificates",
      href: "/admin/certificates",
      icon: ForwardRef$3,
      permission: { resource: "certificates", action: "read" }
    },
    {
      name: "Content",
      href: "/admin/content",
      icon: ForwardRef$n,
      permission: { resource: "content", action: "read" }
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: ForwardRef$o,
      permission: { resource: "analytics", action: "read" }
    },
    {
      name: "Permissions",
      href: "/admin/permissions",
      icon: ForwardRef$p,
      permission: { resource: "permissions", action: "read" }
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: ForwardRef$q,
      permission: { resource: "settings", action: "read" }
    }
  ];
  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    return canAccess(item.permission.resource, item.permission.action);
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-40 lg:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-75", onClick: onClose }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between h-16 px-6 border-b border-gray-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "eYogi Admin" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600",
                onClick: onClose,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef, { className: "h-6 w-6" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "mt-8 px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: filteredNavigation.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            NavLink,
            {
              to: item.href,
              onClick: onClose,
              className: ({ isActive }) => `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? "bg-blue-50 border-r-2 border-blue-500 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "mr-3 h-5 w-5 flex-shrink-0", "aria-hidden": "true" }),
                item.name
              ]
            },
            item.name
          )) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 w-full p-4 border-t border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-sm font-medium", children: ((_a = profile == null ? void 0 : profile.full_name) == null ? void 0 : _a.charAt(0)) || ((_c = (_b = user == null ? void 0 : user.email) == null ? void 0 : _b.charAt(0)) == null ? void 0 : _c.toUpperCase()) || "A" }) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-700", children: (profile == null ? void 0 : profile.full_name) || ((_d = user == null ? void 0 : user.email) == null ? void 0 : _d.split("@")[0]) || "Admin" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 capitalize", children: (profile == null ? void 0 : profile.role) || "Admin" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: signOut,
                className: "p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors",
                title: "Sign out",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$r, { className: "h-5 w-5" })
              }
            )
          ] }) })
        ]
      }
    )
  ] });
};
const AdminHeader = ({ onMenuClick }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white shadow-sm border-b border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100",
          onClick: onMenuClick,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$s, { className: "h-6 w-6" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-4 lg:ml-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "eYogi Gurukul Admin" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center space-x-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: "p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 relative",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$t, { className: "h-6 w-6" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400" })
        ]
      }
    ) })
  ] }) });
};
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AdminSidebar, { isOpen: sidebarOpen, onClose: () => setSidebarOpen(false) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:pl-64", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AdminHeader, { onMenuClick: () => setSidebarOpen(true) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
    ] })
  ] });
};
const AdminDashboard = () => {
  const [stats, setStats] = reactExports.useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalCertificates: 0,
    recentEnrollments: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    loadDashboardStats();
  }, []);
  const loadDashboardStats = async () => {
    try {
      if (false) ;
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const [
        totalUsersResult,
        totalCoursesResult,
        totalEnrollmentsResult,
        totalCertificatesResult,
        recentEnrollmentsResult,
        activeUsersResult
      ] = await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("courses").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("enrollments").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("certificates").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("enrollments").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString()),
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active")
      ]);
      setStats({
        totalUsers: totalUsersResult.count || 0,
        totalCourses: totalCoursesResult.count || 0,
        totalEnrollments: totalEnrollmentsResult.count || 0,
        totalCertificates: totalCertificatesResult.count || 0,
        recentEnrollments: recentEnrollmentsResult.count || 0,
        activeUsers: activeUsersResult.count || 0
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      setStats({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        totalCertificates: 0,
        recentEnrollments: 0,
        activeUsers: 0
      });
    } finally {
      setLoading(false);
    }
  };
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: ForwardRef$l,
      color: "bg-blue-500",
      change: `+${stats.recentEnrollments} this month`
    },
    {
      title: "Active Courses",
      value: stats.totalCourses,
      icon: ForwardRef$4,
      color: "bg-green-500",
      change: "All time"
    },
    {
      title: "Total Enrollments",
      value: stats.totalEnrollments,
      icon: ForwardRef$m,
      color: "bg-yellow-500",
      change: `+${stats.recentEnrollments} recent`
    },
    {
      title: "Certificates Issued",
      value: stats.totalCertificates,
      icon: ForwardRef$3,
      color: "bg-purple-500",
      change: "All time"
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: ForwardRef$u,
      color: "bg-indigo-500",
      change: "Currently active"
    },
    {
      title: "Monthly Growth",
      value: `${stats.recentEnrollments}`,
      icon: ForwardRef$o,
      color: "bg-pink-500",
      change: "Last 30 days"
    }
  ];
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Dashboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Loading analytics..." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: [...Array(6)].map((_, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-lg bg-gray-200 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-6 bg-gray-300 rounded" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-4 w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 bg-gray-200 rounded animate-pulse mb-1 w-1/2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 bg-gray-200 rounded animate-pulse w-full" })
            ] })
          ] }) })
        },
        index
      )) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Dashboard" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Welcome to the eYogi Gurukul Admin Console" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", children: statCards.map((card, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-3 rounded-lg ${card.color}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(card.icon, { className: "h-6 w-6 text-white" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-4 w-0 flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: card.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "flex items-baseline", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-semibold text-gray-900", children: card.value.toLocaleString() }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-sm text-gray-500", children: card.change })
          ] }) })
        ] }) })
      },
      index
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white shadow-sm rounded-lg border border-gray-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Quick Actions" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$l, { className: "h-8 w-8 text-blue-600 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-gray-900", children: "Add New User" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "Create student or teacher account" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$4, { className: "h-8 w-8 text-green-600 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-gray-900", children: "Create Course" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "Set up a new course" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$m, { className: "h-8 w-8 text-yellow-600 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-gray-900", children: "Manage Enrollments" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "Review pending enrollments" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$o, { className: "h-8 w-8 text-purple-600 mb-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium text-gray-900", children: "View Reports" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "Analytics and insights" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white shadow-sm rounded-lg border border-gray-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Recent Activity" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-gray-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Activity feed will be implemented in Phase 2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Coming soon: Real-time enrollment updates, user registrations, and system events" })
      ] }) })
    ] })
  ] });
};
const roleOptions = [
  { value: "student", label: "Student", color: "bg-blue-100 text-blue-800" },
  { value: "teacher", label: "Teacher", color: "bg-green-100 text-green-800" },
  { value: "admin", label: "Admin", color: "bg-purple-100 text-purple-800" },
  { value: "super_admin", label: "Super Admin", color: "bg-red-100 text-red-800" },
  { value: "parent", label: "Parent", color: "bg-yellow-100 text-yellow-800" }
];
const statusOptions = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-gray-100 text-gray-800" },
  { value: "suspended", label: "Suspended", color: "bg-red-100 text-red-800" },
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" }
];
function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  mode
}) {
  const [loading, setLoading] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState({
    email: "",
    password: "",
    full_name: "",
    role: "student",
    status: "active",
    phone: "",
    date_of_birth: "",
    address: "",
    emergency_contact: ""
  });
  reactExports.useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        email: user.email || "",
        password: "",
        // Don't populate password for editing
        full_name: user.full_name || "",
        role: user.role || "student",
        status: user.status || "active",
        phone: user.phone || "",
        date_of_birth: user.date_of_birth || "",
        address: user.address || "",
        emergency_contact: user.emergency_contact || ""
      });
    } else {
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "student",
        status: "active",
        phone: "",
        date_of_birth: "",
        address: "",
        emergency_contact: ""
      });
    }
  }, [mode, user, isOpen]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const validateForm = () => {
    if (!formData.email) {
      zt.error("Email is required");
      return false;
    }
    if (mode === "create" && !formData.password) {
      zt.error("Password is required for new users");
      return false;
    }
    if (!formData.full_name) {
      zt.error("Full name is required");
      return false;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      zt.error("Please enter a valid email address");
      return false;
    }
    if (mode === "create" && formData.password && formData.password.length < 6) {
      zt.error("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === "create") {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true
        });
        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`);
        }
        if (!authData.user) {
          throw new Error("Failed to create user account");
        }
        const profileData = {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          status: formData.status,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          emergency_contact: formData.emergency_contact || null,
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        const { error: profileError } = await supabaseAdmin.from("profiles").insert([profileData]);
        if (profileError) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Profile creation error: ${profileError.message}`);
        }
        zt.success("User created successfully!");
      } else {
        const updateData = {
          full_name: formData.full_name,
          role: formData.role,
          status: formData.status,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address || null,
          emergency_contact: formData.emergency_contact || null,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        const { error: profileError } = await supabaseAdmin.from("profiles").update(updateData).eq("id", user.id);
        if (profileError) {
          throw new Error(`Update error: ${profileError.message}`);
        }
        if (formData.email !== user.email) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            email: formData.email
          });
          if (authError) {
            throw new Error(`Email update error: ${authError.message}`);
          }
        }
        if (formData.password) {
          const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: formData.password
          });
          if (passwordError) {
            throw new Error(`Password update error: ${passwordError.message}`);
          }
        }
        zt.success("User updated successfully!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
      zt.error(error.message || "An error occurred while saving the user");
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5 text-blue-600" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-gray-900", children: mode === "create" ? "Create New User" : "Edit User" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5 text-gray-500" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-4 w-4 inline mr-1" }),
            "Email Address *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "email",
              name: "email",
              value: formData.email,
              onChange: handleInputChange,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              placeholder: "user@example.com",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4 inline mr-1" }),
            "Full Name *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              name: "full_name",
              value: formData.full_name,
              onChange: handleInputChange,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              placeholder: "John Doe",
              required: true
            }
          )
        ] }),
        (mode === "create" || mode === "edit") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [
            "Password ",
            mode === "create" ? "*" : "(leave blank to keep current)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              name: "password",
              value: formData.password,
              onChange: handleInputChange,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              placeholder: mode === "create" ? "Enter password" : "Enter new password",
              required: mode === "create",
              minLength: 6
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Phone Number" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "tel",
              name: "phone",
              value: formData.phone,
              onChange: handleInputChange,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              placeholder: "+1 (555) 123-4567"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4 inline mr-1" }),
            "Role *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              name: "role",
              value: formData.role,
              onChange: handleInputChange,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              required: true,
              children: roleOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              name: "status",
              value: formData.status,
              onChange: handleInputChange,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              required: true,
              children: statusOptions.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 inline mr-1" }),
            "Date of Birth"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "date",
              name: "date_of_birth",
              value: formData.date_of_birth,
              onChange: handleInputChange,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Emergency Contact" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              name: "emergency_contact",
              value: formData.emergency_contact,
              onChange: handleInputChange,
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              placeholder: "Contact name and phone"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Address" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            name: "address",
            value: formData.address,
            onChange: handleInputChange,
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            placeholder: "Street address, city, state, zip"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end space-x-3 pt-6 border-t border-gray-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "submit",
            disabled: loading,
            className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2",
            children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Saving..." })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: mode === "create" ? "Create User" : "Update User" })
            ] })
          }
        )
      ] })
    ] })
  ] }) });
}
const AdminUserManagement = () => {
  const [users, setUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [roleFilter, setRoleFilter] = reactExports.useState("all");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [isModalOpen, setIsModalOpen] = reactExports.useState(false);
  const [editingUser, setEditingUser] = reactExports.useState(null);
  const { user: currentUser } = useAuth();
  reactExports.useEffect(() => {
    loadUsers();
  }, []);
  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Error loading users:", error);
        zt.error("Failed to load users");
        return;
      }
      const validUsers = (data || []).filter(
        (user) => user.full_name && user.email && user.role && user.id !== (currentUser == null ? void 0 : currentUser.id)
        // Don't show current admin user
      );
      setUsers(validUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      zt.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };
  const handleEditUser = (user) => {
    if (user.role === "super_admin" && (currentUser == null ? void 0 : currentUser.id) !== user.id) {
      zt.error("Cannot edit super admin users");
      return;
    }
    setEditingUser(user);
    setIsModalOpen(true);
  };
  const handleDeleteUser = async (userId, userRole) => {
    if (userRole === "super_admin") {
      zt.error("Cannot delete super admin users");
      return;
    }
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    try {
      const { error } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
      if (error) {
        console.error("Error deleting user:", error);
        zt.error("Failed to delete user");
        return;
      }
      zt.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      zt.error("Failed to delete user");
    }
  };
  const handleUserSaved = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    loadUsers();
  };
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()) || user.student_id && user.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      case "parent":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending_verification":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const isProtectedUser = (user) => {
    return user.role === "super_admin" || user.id === (currentUser == null ? void 0 : currentUser.id);
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center min-h-96", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "User Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Manage students, teachers, and administrators" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: handleCreateUser,
          className: "inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$v, { className: "h-5 w-5 mr-2" }),
            "Add User"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white p-6 rounded-lg shadow-sm border border-gray-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$f, { className: "h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "Search users...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: "pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: roleFilter,
          onChange: (e) => setRoleFilter(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Roles" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "student", children: "Students" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "teacher", children: "Teachers" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "admin", children: "Admins" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "super_admin", children: "Super Admins" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "parent", children: "Parents" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All Statuses" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "active", children: "Active" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "inactive", children: "Inactive" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "suspended", children: "Suspended" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pending_verification", children: "Pending" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center text-sm text-gray-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$g, { className: "h-4 w-4 mr-1" }),
        filteredUsers.length,
        " of ",
        users.length,
        " users"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "User" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Student ID" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Created" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredUsers.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-gray-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 h-10 w-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-sm font-medium", children: user.full_name.charAt(0) }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-900", children: user.full_name }),
                isProtectedUser(user) && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ForwardRef$w,
                  {
                    className: "h-4 w-4 text-red-500 ml-2",
                    title: "Protected user"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500", children: user.email })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`,
              children: user.role.replace("_", " ")
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`,
              children: user.status.replace("_", " ")
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: user.student_id || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: new Date(user.created_at).toLocaleDateString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                },
                className: "text-gray-600 hover:text-gray-900 p-1",
                title: "View user",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$j, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => handleEditUser(user),
                disabled: isProtectedUser(user) && (currentUser == null ? void 0 : currentUser.id) !== user.id,
                className: `p-1 ${isProtectedUser(user) && (currentUser == null ? void 0 : currentUser.id) !== user.id ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:text-blue-900"}`,
                title: isProtectedUser(user) ? "Protected user" : "Edit user",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$x, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => handleDeleteUser(user.id, user.role),
                disabled: isProtectedUser(user),
                className: `p-1 ${isProtectedUser(user) ? "text-gray-300 cursor-not-allowed" : "text-red-600 hover:text-red-900"}`,
                title: isProtectedUser(user) ? "Protected user" : "Delete user",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$y, { className: "h-4 w-4" })
              }
            )
          ] }) })
        ] }, user.id)) })
      ] }) }),
      filteredUsers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ForwardRef$v, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No users found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-gray-500", children: searchTerm || roleFilter !== "all" || statusFilter !== "all" ? "Try adjusting your search criteria." : "Get started by adding a new user." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      UserFormModal,
      {
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false),
        onSuccess: handleUserSaved,
        user: editingUser,
        mode: editingUser ? "edit" : "create"
      }
    )
  ] });
};
const Switch = ({
  checked,
  onCheckedChange,
  disabled = false,
  className = ""
}) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": checked,
      disabled,
      onClick: () => onCheckedChange(!checked),
      className: `
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
        ${checked ? "bg-blue-600" : "bg-gray-200"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `
          inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
          ${checked ? "translate-x-6" : "translate-x-1"}
        `
        }
      )
    }
  );
};
const PermissionContext = reactExports.createContext(void 0);
const usePermissions = () => {
  const context = reactExports.useContext(PermissionContext);
  if (context === void 0) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};
const ROLE_PERMISSIONS = {
  super_admin: [
    // Full access to everything
    "users.create",
    "users.read",
    "users.update",
    "users.delete",
    "courses.create",
    "courses.read",
    "courses.update",
    "courses.delete",
    "enrollments.read",
    "enrollments.update",
    "enrollments.approve",
    "certificates.read",
    "certificates.create",
    "certificates.delete",
    "analytics.read",
    "analytics.export",
    "settings.read",
    "settings.update",
    "permissions.read",
    "permissions.update",
    "content.create",
    "content.read",
    "content.update",
    "content.delete",
    "admin.access",
    "admin.dashboard"
  ],
  admin: [
    // Standard admin permissions
    "users.create",
    "users.read",
    "users.update",
    "users.delete",
    "courses.create",
    "courses.read",
    "courses.update",
    "courses.delete",
    "enrollments.read",
    "enrollments.update",
    "certificates.read",
    "certificates.create",
    "analytics.read",
    "settings.read",
    "permissions.read",
    "content.create",
    "content.read",
    "content.update",
    "content.delete",
    "admin.access",
    "admin.dashboard"
  ],
  teacher: [
    // Teacher permissions - can manage courses and view students
    "courses.create",
    "courses.read",
    "courses.update",
    "enrollments.read",
    "enrollments.update",
    "certificates.read",
    "certificates.create",
    "users.read",
    // Can view student profiles
    "content.create",
    "content.read",
    "content.update",
    "admin.access"
    // Can access admin interface with limited features
  ],
  student: [
    // Student permissions - view only for own data
    "courses.read",
    "enrollments.read",
    // Own enrollments only
    "certificates.read",
    // Own certificates only
    "content.read"
    // No admin access
  ],
  parent: [
    // Parent permissions - view child's data
    "courses.read",
    "enrollments.read",
    // Child's enrollments
    "certificates.read",
    // Child's certificates
    "content.read"
    // No admin access
  ]
};
const PermissionProvider = ({ children }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    setIsLoading(authLoading);
  }, [authLoading]);
  const getUserRole = () => {
    if (user && !profile) {
      return "super_admin";
    }
    return (profile == null ? void 0 : profile.role) || "student";
  };
  const getUserPermissions = () => {
    const userRole = getUserRole();
    return ROLE_PERMISSIONS[userRole] || [];
  };
  const canAccess = (resource, action) => {
    if (user) {
      return true;
    }
    const permissionKey = `${resource}.${action}`;
    const userPermissions = getUserPermissions();
    return userPermissions.includes(permissionKey);
  };
  const hasAnyPermission = (permissions) => {
    const userPermissions = getUserPermissions();
    return permissions.some((permission) => userPermissions.includes(permission));
  };
  const value = {
    canAccess,
    hasAnyPermission,
    getUserPermissions,
    isLoading
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PermissionContext.Provider, { value, children });
};
const getIconForResource = (resource) => {
  switch (resource.toLowerCase()) {
    case "users":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" });
    case "courses":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Book, { className: "h-4 w-4" });
    case "enrollments":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(GraduationCap, { className: "h-4 w-4" });
    case "settings":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-4 w-4" });
    case "permissions":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "h-4 w-4" });
    default:
      return /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" });
  }
};
const ROLE_DEFAULTS = {
  admin: [],
  teacher: [],
  student: []
};
function AdminPermissionManagement() {
  const [permissions, setPermissions] = reactExports.useState([]);
  const [rolePermissions, setRolePermissions] = reactExports.useState(ROLE_DEFAULTS);
  const [selectedRole, setSelectedRole] = reactExports.useState("admin");
  const [loading, setLoading] = reactExports.useState(false);
  const [hasChanges, setHasChanges] = reactExports.useState(false);
  const [isLoadingData, setIsLoadingData] = reactExports.useState(true);
  const { canAccess } = usePermissions();
  const loadPermissions = async () => {
    try {
      setIsLoadingData(true);
      const { data: permissionsData, error: permError } = await supabaseAdmin.from("permissions").select("*").order("resource, action");
      if (permError) throw permError;
      const { data: rolePermData, error: roleError } = await supabaseAdmin.from("role_permissions").select(`
          id,
          role,
          permission_id,
          created_at,
          permission:permissions(*)
        `);
      if (roleError) throw roleError;
      const uiPermissions = (permissionsData || []).map((perm) => ({
        id: perm.id,
        name: perm.name,
        description: perm.description || "",
        icon: getIconForResource(perm.resource),
        resource: perm.resource,
        action: perm.action
      }));
      setPermissions(uiPermissions);
      const rolePermissionMap = {
        admin: [],
        teacher: [],
        student: []
      };
      (rolePermData || []).forEach((rp) => {
        if (rolePermissionMap[rp.role]) {
          rolePermissionMap[rp.role].push(rp.permission_id);
        }
      });
      setRolePermissions(rolePermissionMap);
    } catch (error) {
      console.error("Error loading permissions:", error);
      zt.error("Failed to load permissions from database");
    } finally {
      setIsLoadingData(false);
    }
  };
  const savePermissions = async () => {
    if (!canAccess("permissions", "update")) {
      zt.error("You don't have permission to update permissions");
      return;
    }
    try {
      setLoading(true);
      const { error: deleteError } = await supabaseAdmin.from("role_permissions").delete().eq("role", selectedRole);
      if (deleteError) throw deleteError;
      if (rolePermissions[selectedRole].length > 0) {
        const rolePermissionInserts = rolePermissions[selectedRole].map((permissionId) => ({
          role: selectedRole,
          permission_id: permissionId
        }));
        const { error: insertError } = await supabaseAdmin.from("role_permissions").insert(rolePermissionInserts);
        if (insertError) throw insertError;
      }
      setHasChanges(false);
      zt.success(`Permissions saved for ${selectedRole} role`);
    } catch (error) {
      console.error("Error saving permissions:", error);
      zt.error("Failed to save permissions to database");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadPermissions();
  }, []);
  if (!canAccess("permissions", "view")) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-12 w-12 text-red-500 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Access Denied" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500", children: "You don't have permission to view permissions." })
    ] }) });
  }
  if (isLoadingData) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Loading permissions..." })
    ] }) });
  }
  const handlePermissionChange = (permissionId, checked) => {
    setRolePermissions((prev) => {
      const currentPermissions2 = prev[selectedRole] || [];
      const newPermissions = checked ? [...currentPermissions2, permissionId] : currentPermissions2.filter((p) => p !== permissionId);
      setHasChanges(true);
      return {
        ...prev,
        [selectedRole]: newPermissions
      };
    });
    zt.success(`Permission ${checked ? "granted" : "removed"} for ${selectedRole}`);
  };
  const roles = Object.keys(ROLE_DEFAULTS);
  const currentPermissions = rolePermissions[selectedRole] || [];
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      const resource = permission.resource;
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(permission);
      return acc;
    },
    {}
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Permission Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Manage role-based permissions for your application" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: loadPermissions,
            disabled: isLoadingData,
            className: "flex items-center gap-2",
            style: { backgroundColor: "#6b7280", color: "white" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${isLoadingData ? "animate-spin" : ""}` }),
              "Refresh"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            onClick: savePermissions,
            disabled: loading || !hasChanges,
            className: "flex items-center gap-2",
            style: { backgroundColor: hasChanges ? "#3b82f6" : "#6b7280", color: "white" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
              loading ? "Saving..." : "Save Changes"
            ]
          }
        )
      ] })
    ] }),
    hasChanges && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-yellow-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-yellow-800", children: "You have unsaved changes" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Role Selection" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Select a role to manage its permissions. Changes are saved to the database." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: roles.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => setSelectedRole(role),
          className: "capitalize",
          style: {
            backgroundColor: selectedRole === role ? "#3b82f6" : "transparent",
            color: selectedRole === role ? "white" : "#374151",
            border: "1px solid #d1d5db"
          },
          children: [
            role,
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", className: "ml-2", children: (rolePermissions[role] || []).length })
          ]
        },
        role
      )) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "capitalize flex items-center gap-2", children: [
          resourcePermissions[0].icon,
          resource,
          " Permissions"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
          "Manage ",
          resource,
          "-related permissions for the ",
          selectedRole,
          " role"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: resourcePermissions.map((permission) => {
        const isChecked = currentPermissions.includes(permission.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-gray-100 rounded-md", children: permission.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-gray-900", children: permission.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-500", children: permission.description })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                isChecked && /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-green-500" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Switch,
                  {
                    checked: isChecked,
                    onCheckedChange: (checked) => handlePermissionChange(permission.id, checked)
                  }
                )
              ] })
            ]
          },
          permission.id
        );
      }) }) })
    ] }, resource)) })
  ] });
}
const ProtectedRoute$1 = ({
  children
  // requiredRole, // For future role-based access control
  // requiredPermission, // For future permission-based access control
}) => {
  const { isSuperAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) });
  }
  if (!isSuperAdmin) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/admin/login", state: { from: location }, replace: true });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
};
function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/auth/signin"
}) {
  const { user: superAdminUser, loading: authLoading, isSuperAdmin } = useAuth();
  const { user: websiteUser, loading: websiteLoading } = useWebsiteAuth();
  const location = useLocation();
  if (authLoading || websiteLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Loading..." })
    ] }) });
  }
  const isAuthenticated = isSuperAdmin || !!websiteUser;
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: redirectTo, state: { from: location }, replace: true });
  }
  if (isSuperAdmin) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
  }
  if (requiredRole && (websiteUser == null ? void 0 : websiteUser.role) !== requiredRole) {
    const dashboardPath = (websiteUser == null ? void 0 : websiteUser.role) ? `/dashboard/${websiteUser.role}` : "/dashboard";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: dashboardPath, replace: true });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
}
const LoadingFallback = () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center space-y-4", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 animate-pulse", children: "Loading eYogi Gurukul..." })
] }) });
function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = reactExports.useState(false);
  const [authModalMode, setAuthModalMode] = reactExports.useState("signin");
  const openAuthModal = (mode = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(GlossyHeader, { onOpenAuthModal: openAuthModal }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "pt-16 lg:pt-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingFallback, {}), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(HomePage, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/about", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AboutPage, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/contact", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ContactPage, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/courses", element: /* @__PURE__ */ jsxRuntimeExports.jsx(CoursesPage, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/gurukuls", element: /* @__PURE__ */ jsxRuntimeExports.jsx(GurukulPage, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth/*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AuthRedirect, { openModal: openAuthModal }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Route,
        {
          path: "/dashboard",
          element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPage, {}) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Route,
        {
          path: "/dashboard/student",
          element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredRole: "student", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StudentDashboard, {}) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Route,
        {
          path: "/dashboard/teacher",
          element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute, { requiredRole: "teacher", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TeacherDashboard, {}) })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/admin/login", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLogin, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Route,
        {
          path: "/admin/*",
          element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProtectedRoute$1, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminLayout, {}) }),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { index: true, element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "dashboard", replace: true }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "dashboard", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminDashboard, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "users", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminUserManagement, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "permissions", element: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminPermissionManagement, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Route,
              {
                path: "courses",
                element: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Course Management" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Coming in Phase 2: Course creation and management tools" })
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Route,
              {
                path: "enrollments",
                element: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Enrollment Management" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Coming in Phase 2: Enrollment approval and tracking system" })
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Route,
              {
                path: "certificates",
                element: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Certificate Management" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Coming in Phase 3: Certificate templates and generation" })
                ] })
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true }) })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Fe,
      {
        position: "top-right",
        toastOptions: {
          style: {
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      WebsiteAuthModal,
      {
        isOpen: isAuthModalOpen,
        onClose: () => setIsAuthModalOpen(false),
        initialMode: authModalMode
      }
    )
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    BrowserRouter,
    {
      basename: "/ssh-app",
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuthProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(WebsiteAuthProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PermissionProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) }) }) })
    }
  ) })
);
