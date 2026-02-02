import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User, Shield, GraduationCap, Users, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import LoginButton from '@greatsumini/react-facebook-login';
import api from "../lib/api";



interface AuthProps {
  onLoginSuccess?: (role: string) => void;
  onBack?: () => void;
  initialTab?: "login" | "register";
}

export function Auth({ onLoginSuccess, onBack, initialTab = "login" }: AuthProps) {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    userId: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Validar email general
  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Determinar rol basado en ID
  const determineRole = (userId: string): string => {
    if (userId.startsWith("EST")) return "Estudiante";
    if (userId.startsWith("DOC")) return "Docente";
    if (userId.startsWith("ADM")) return "Administrador";
    return "No identificado";
  };

  // Obtener icono de rol
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Estudiante":
        return <GraduationCap className="w-4 h-4" />;
      case "Docente":
        return <Users className="w-4 h-4" />;
      case "Administrador":
        return <Shield className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Obtener color de rol
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Estudiante":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Docente":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Administrador":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Calcular fortaleza de contraseña
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength === 0 || strength === 1) {
      return { strength: 1, label: "Débil", color: "bg-red-500" };
    } else if (strength === 2 || strength === 3) {
      return { strength: 2, label: "Media", color: "bg-yellow-500" };
    } else {
      return { strength: 3, label: "Fuerte", color: "bg-green-500" };
    }
  };

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  const newErrors: { [key: string]: string } = {};

  if (!loginData.email) {
    newErrors.loginEmail = "El correo es obligatorio";
  } else if (!validateEmail(loginData.email)) {
    newErrors.loginEmail = "Debe ingresar un correo electrónico válido";
  }

  if (!loginData.password) {
    newErrors.loginPassword = "La contraseña es obligatoria";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setSuccessMessage("");
    return;
  }

  setErrors({});
  setSuccessMessage("Iniciando sesión...");

  try {
    const response = await api.post("/auth/login", {
      email: loginData.email,
      password: loginData.password,
    });
    const { token, user } = response.data;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("authToken", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
    }
    setSuccessMessage("Inicio de sesión exitoso. Redirigiendo...");

    const role = user?.role || "student";
    const mappedRole =
      role === "teacher" ? "Docente" : role === "admin" ? "Administrador" : "Estudiante";

    onLoginSuccess?.(mappedRole);
  } catch (err: any) {
    console.error("Login error", err);
    const errorData = err?.response?.data;
    let errorMsg = "Error en el inicio de sesión. Por favor, inténtalo de nuevo.";

    if (errorData) {
      if (errorData.detail === "No user found with this email.") {
        errorMsg = "No se encontró ningún usuario con este correo electrónico.";
      } else if (errorData.detail === "Invalid password.") {
        errorMsg = "La contraseña es incorrecta.";
      } else if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      }
    }
    
    setErrors({ loginGeneral: errorMsg });
    setSuccessMessage("");
  }
};

// Manejar login con Google
const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
  try {
    setSuccessMessage("Autenticando con Google...");
    setErrors({});
    
    const response = await api.post("/auth/google", {
      token: credentialResponse.credential,
    });
    
    const { token, user } = response.data;
    
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("authToken", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
    }
    
    setSuccessMessage("Inicio de sesión exitoso con Google. Redirigiendo...");
    
    const role = user?.role || "student";
    const mappedRole =
      role === "teacher" ? "Docente" : role === "admin" ? "Administrador" : "Estudiante";

    onLoginSuccess?.(mappedRole);
  } catch (err: any) {
    console.error("Google login error", err);
    const errorData = err?.response?.data;
    let errorMsg = "Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.";
    
    if (errorData && typeof errorData.detail === 'string') {
      errorMsg = errorData.detail;
    }
    
    setErrors({ loginGeneral: errorMsg });
    setSuccessMessage("");
  }
};

// Manejar login con Facebook
const handleFacebookLogin = async (response: any) => {
  if (!response.accessToken) {
    setErrors({ loginGeneral: "Error al iniciar sesión con Facebook" });
    return;
  }

  try {
    setSuccessMessage("Autenticando con Facebook...");
    setErrors({});
    
    const apiResponse = await api.post("/auth/facebook", {
      accessToken: response.accessToken,
    });
    
    const { token, user } = apiResponse.data;
    
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("authToken", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
    }
    
    setSuccessMessage("Inicio de sesión exitoso con Facebook. Redirigiendo...");
    
    const role = user?.role || "student";
    const mappedRole =
      role === "teacher" ? "Docente" : role === "admin" ? "Administrador" : "Estudiante";

    onLoginSuccess?.(mappedRole);
  } catch (err: any) {
    console.error("Facebook login error", err);
    const errorData = err?.response?.data;
    let errorMsg = "Error al iniciar sesión con Facebook. Por favor, inténtalo de nuevo.";
    
    if (errorData && typeof errorData.detail === 'string') {
      errorMsg = errorData.detail;
    }
    
    setErrors({ loginGeneral: errorMsg });
    setSuccessMessage("");
  }
};


const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  const newErrors: { [key: string]: string } = {};

  if (!registerData.fullName) {
    newErrors.fullName = "El nombre completo es obligatorio";
  }

  if (!registerData.email) {
    newErrors.registerEmail = "El correo es obligatorio";
  } else if (!validateEmail(registerData.email)) {
    newErrors.registerEmail = "Debe ingresar un correo electrónico válido";
  }

  if (!registerData.userId) {
    newErrors.userId = "El ID de usuario es obligatorio";
  } else if (determineRole(registerData.userId) === "No identificado") {
    newErrors.userId = "El ID debe comenzar con EST, DOC o ADM";
  }

  if (!registerData.password) {
    newErrors.registerPassword = "La contraseña es obligatoria";
  } else if (registerData.password.length < 6) {
    newErrors.registerPassword = "La contraseña debe tener al menos 6 caracteres";
  }

  if (!registerData.confirmPassword) {
    newErrors.confirmPassword = "Debes confirmar la contraseña";
  } else if (registerData.password !== registerData.confirmPassword) {
    newErrors.confirmPassword = "Las contraseñas no coinciden";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setSuccessMessage("");
    return;
  }

  setErrors({});
  setSuccessMessage("Registrando...");

  try {
    const response = await api.post("/auth/register", {
      fullName: registerData.fullName,
      email: registerData.email,
      password: registerData.password,
      userId: registerData.userId,
    });
    const { token, user } = response.data;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("authToken", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
    }

    const role = determineRole(registerData.userId);
    setSuccessMessage(`Registro exitoso como ${role}. Redirigiendo al panel...`);
    onLoginSuccess?.(role);
  } catch (err: any) {
    console.error("Register error", err);
    const errorData = err?.response?.data;
    let errorMsg = "Error en el registro. Por favor, inténtalo de nuevo.";

    if (errorData) {
      if (errorData.email) {
        errorMsg = "El correo electrónico ya está en uso.";
      } else if (errorData.userId) {
        errorMsg = "El ID de usuario ya existe.";
      } else if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      }
    }
    
    setErrors({ registerGeneral: errorMsg });
    setSuccessMessage("");
  }
};

  const currentRole = determineRole(registerData.userId);
  const passwordStrength = getPasswordStrength(registerData.password);

  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl relative z-10">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-gray-700 hover:text-cyan-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al inicio</span>
          </button>
        )}

        {/* Main Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="grid md:grid-cols-2 min-h-[600px]">
            {/* Register Tab Content */}
            {activeTab === "register" && (
              <>
                {/* Left Side - Registration Form */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-12 flex flex-col justify-center order-2 md:order-1"
                >
                  <h2 className="text-4xl font-bold text-gray-800 mb-8">Registro</h2>

                  {successMessage && (
                    <Alert className="mb-4 border-green-500 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        {successMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Full Name */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Nombre Completo"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        className={`pl-4 pr-12 py-6 bg-gray-100 border-0 rounded-xl text-gray-700 placeholder-gray-400 focus:bg-gray-200 transition-colors ${
                          errors.fullName ? "ring-2 ring-red-500" : ""
                        }`}
                      />
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="Correo Electrónico"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className={`pl-4 pr-12 py-6 bg-gray-100 border-0 rounded-xl text-gray-700 placeholder-gray-400 focus:bg-gray-200 transition-colors ${
                          errors.registerEmail ? "ring-2 ring-red-500" : ""
                        }`}
                      />
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                      {errors.registerEmail && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.registerEmail}
                        </p>
                      )}
                    </div>

                    {/* User ID */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="ID de Usuario (EST001, DOC001, ADM001)"
                        value={registerData.userId}
                        onChange={(e) => setRegisterData({ ...registerData, userId: e.target.value })}
                        className={`pl-4 pr-12 py-6 bg-gray-100 border-0 rounded-xl text-gray-700 placeholder-gray-400 focus:bg-gray-200 transition-colors ${
                          errors.userId ? "ring-2 ring-red-500" : ""
                        }`}
                      />
                      {getRoleIcon(currentRole) && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {getRoleIcon(currentRole)}
                        </div>
                      )}
                      {errors.userId && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.userId}
                        </p>
                      )}
                      {registerData.userId && currentRole !== "No identificado" && (
                        <p className="text-xs text-gray-600 mt-1">Rol: {currentRole}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className={`pl-4 pr-12 py-6 bg-gray-100 border-0 rounded-xl text-gray-700 placeholder-gray-400 focus:bg-gray-200 transition-colors ${
                          errors.registerPassword ? "ring-2 ring-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        <Lock className="w-5 h-5" />
                      </button>
                      {errors.registerPassword && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.registerPassword}
                        </p>
                      )}
                      {registerData.password && (
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.strength ? passwordStrength.color : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmar Contraseña"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className={`pl-4 pr-12 py-6 bg-gray-100 border-0 rounded-xl text-gray-700 placeholder-gray-400 focus:bg-gray-200 transition-colors ${
                          errors.confirmPassword ? "ring-2 ring-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        <Lock className="w-5 h-5" />
                      </button>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.confirmPassword}
                        </p>
                      )}
                      {registerData.confirmPassword && registerData.password === registerData.confirmPassword && (
                        <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Las contraseñas coinciden
                        </p>
                      )}
                    </div>

                    {/* Register Button */}
                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-full font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02] mt-6"
                    >
                      Registrarse
                    </button>
                  </form>

                  {/* Social Register */}
                  <div className="mt-6">
                    <p className="text-center text-gray-500 text-sm mb-4">o regístrate con otras plataformas</p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => {
                          const googleBtn = document.querySelector('[aria-labelledby="button-label"]') as HTMLElement;
                          if (googleBtn) googleBtn.click();
                        }}
                        className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-cyan-500 hover:shadow-md transition-all"
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </button>

                      <LoginButton
                        appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""}
                        onSuccess={handleFacebookLogin}
                        onFail={() => setErrors({ registerGeneral: "Error con Facebook" })}
                        render={({ onClick }: any) => (
                          <button onClick={onClick} className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-blue-600 hover:shadow-md transition-all">
                            <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </button>
                        )}
                      />

                      <button className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center opacity-40 cursor-not-allowed" disabled>
                        <svg className="w-6 h-6" fill="#333" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </button>

                      <button className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center opacity-40 cursor-not-allowed" disabled>
                        <svg className="w-6 h-6" fill="#0077B5" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {errors.registerGeneral && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.registerGeneral}</AlertDescription>
                    </Alert>
                  )}
                </motion.div>

                {/* Right Side - Welcome Back Panel */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-600 p-12 flex flex-col justify-center items-center text-white overflow-hidden order-1 md:order-2"
                >
                  <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 text-center">
                    <h2 className="text-5xl font-bold mb-4">¡Bienvenido de Vuelta!</h2>
                    <p className="text-teal-50 mb-8 text-lg">¿Ya tienes una cuenta?</p>
                    <button
                      onClick={() => setActiveTab("login")}
                      className="px-8 py-3 border-2 border-white rounded-full hover:bg-white hover:text-teal-600 transition-all duration-300 font-medium"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                </motion.div>
              </>
            )}

            {/* Login Tab Content */}
            {activeTab === "login" && (
              <>
                {/* Left Side - Welcome Panel */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-600 p-12 flex flex-col justify-center items-center text-white overflow-hidden"
                >
                  {/* Decorative Circle */}
                  <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 text-center">
                    <h2 className="text-5xl font-bold mb-4">Hola, Bienvenido</h2>
                    <p className="text-cyan-50 mb-8 text-lg">¿No tienes una cuenta?</p>
                    <button
                      onClick={() => setActiveTab("register")}
                      className="px-8 py-3 border-2 border-white rounded-full hover:bg-white hover:text-cyan-600 transition-all duration-300 font-medium"
                    >
                      Registrarse
                    </button>
                  </div>
                </motion.div>

                {/* Right Side - Login Form */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-12 flex flex-col justify-center"
                >
                  <h2 className="text-4xl font-bold text-gray-800 mb-8">Iniciar Sesión</h2>

                  {successMessage && (
                    <Alert className="mb-4 border-green-500 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        {successMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleLogin} className="space-y-6">
                    {/* Email Input */}
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="Correo Electrónico"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className={`pl-4 pr-12 py-6 bg-gray-100 border-0 rounded-xl text-gray-700 placeholder-gray-400 focus:bg-gray-200 transition-colors ${
                          errors.loginEmail ? "ring-2 ring-red-500" : ""
                        }`}
                      />
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                      {errors.loginEmail && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.loginEmail}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Contraseña"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className={`pl-4 pr-12 py-6 bg-gray-100 border-0 rounded-xl text-gray-700 placeholder-gray-400 focus:bg-gray-200 transition-colors ${
                          errors.loginPassword ? "ring-2 ring-red-500" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        <Lock className="w-5 h-5" />
                      </button>
                      {errors.loginPassword && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.loginPassword}
                        </p>
                      )}
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                      <a href="#" className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">
                        ¿Olvidaste tu contraseña?
                      </a>
                    </div>

                    {/* Login Button */}
                    <button
                      type="submit"
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-full font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      Iniciar Sesión
                    </button>
                  </form>

                  {/* Social Login */}
                  <div className="mt-8">
                    <p className="text-center text-gray-500 text-sm mb-4">o inicia sesión con otras plataformas</p>
                    <div className="flex justify-center gap-4">
                      {/* Google */}
                      <button
                        onClick={() => {
                          const googleBtn = document.querySelector('[aria-labelledby="button-label"]') as HTMLElement;
                          if (googleBtn) googleBtn.click();
                        }}
                        className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-cyan-500 hover:shadow-md transition-all"
                        title="Google"
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </button>
                      <div className="hidden">
                        <GoogleLogin onSuccess={handleGoogleLogin} onError={() => setErrors({ loginGeneral: "Error con Google" })} />
                      </div>

                      {/* Facebook */}
                      <LoginButton
                        appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""}
                        onSuccess={handleFacebookLogin}
                        onFail={() => setErrors({ loginGeneral: "Error con Facebook" })}
                        render={({ onClick }: any) => (
                          <button
                            onClick={onClick}
                            className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center hover:border-blue-600 hover:shadow-md transition-all"
                            title="Facebook"
                          >
                            <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </button>
                        )}
                      />

                      {/* GitHub */}
                      <button
                        className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center opacity-40 cursor-not-allowed"
                        disabled
                        title="Próximamente"
                      >
                        <svg className="w-6 h-6" fill="#333" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </button>

                      {/* LinkedIn */}
                      <button
                        className="w-14 h-14 border-2 border-gray-200 rounded-xl flex items-center justify-center opacity-40 cursor-not-allowed"
                        disabled
                        title="Próximamente"
                      >
                        <svg className="w-6 h-6" fill="#0077B5" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {errors.loginGeneral && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.loginGeneral}</AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Auth;
