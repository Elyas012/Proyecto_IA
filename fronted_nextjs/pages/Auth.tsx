import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User, Shield, GraduationCap, Users, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import axios from 'axios';


interface AuthProps {
  onLoginSuccess?: (role: string) => void;
  onBack?: () => void;
}

export function Auth({ onLoginSuccess, onBack }: AuthProps) {
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

  // Manejar login
  const handleLogin = (e: React.FormEvent) => {
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

    // Call backend login endpoint
    setErrors({});
    setSuccessMessage("Iniciando sesión...");
      axios.post('/api/auth/login', {
        email: loginData.email,
        password: loginData.password,
      })
      .then(response => {
      const token = response.data?.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      setSuccessMessage('Inicio de sesión exitoso. Redirigiendo...');
      onLoginSuccess?.("Estudiante");
    })
    .catch(err => {
      console.error('Login error', err);
      const msg = err.response?.data?.detail || 'Error en las credenciales';
      setErrors({ loginGeneral: msg });
      setSuccessMessage('');
    });
  };

  // Manejar registro
  const handleRegister = (e: React.FormEvent) => {
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
    } else if (registerData.userId.length < 3) {
      newErrors.userId = "El ID debe tener al menos 3 caracteres";
    }

    if (!registerData.password) {
      newErrors.registerPassword = "La contraseña es obligatoria";
    } else if (registerData.password.length < 6) {
      newErrors.registerPassword = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = "Debe confirmar la contraseña";
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccessMessage("");
      return;
    }

    // Call backend register endpoint
    setErrors({});
    setSuccessMessage('Registrando...');
    axios.post('/api/auth/register', {
      fullName: registerData.fullName,
      email: registerData.email,
      password: registerData.password,
      userId: registerData.userId,
    })
    .then(response => {
      const token = response.data?.token;
      if (token) localStorage.setItem('authToken', token);
      const role = determineRole(registerData.userId);
      setSuccessMessage(`Registro exitoso como ${role}. Redirigiendo al panel...`);
      onLoginSuccess?.(role);
    })
    .catch(err => {
      console.error('Register error', err);
      const msg = err.response?.data?.detail || 'Error en el registro';
      setErrors({ registerGeneral: msg });
      setSuccessMessage('');
    });
  };

  const currentRole = determineRole(registerData.userId);
  const passwordStrength = getPasswordStrength(registerData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-gray-700 hover:text-cyan-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al inicio</span>
          </motion.button>
        )}

        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent mb-4">FocusLearn</h1>
          <p className="text-gray-700">Sistema de Monitoreo de Atención Estudiantil</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
            <Tabs defaultValue="login" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="register">Registro</TabsTrigger>
                </TabsList>
              </CardHeader>

              {/* Login Tab */}
              <TabsContent value="login">
                <CardContent>
                  <CardDescription className="mb-6">
                    Ingresa tus credenciales de acceso
                  </CardDescription>

                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert className="mb-4 border-green-500 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          {successMessage}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="usuario@ejemplo.com"
                          value={loginData.email}
                          onChange={(e) =>
                            setLoginData({ ...loginData, email: e.target.value })
                          }
                          className={`pl-10 ${errors.loginEmail ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                      </div>
                      {errors.loginEmail && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.loginEmail}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({ ...loginData, password: e.target.value })
                          }
                          className={`pl-10 pr-10 ${errors.loginPassword ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.loginPassword && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.loginPassword}
                        </motion.p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <a href="#" className="text-cyan-600 hover:underline hover:text-cyan-200 transition-colors">
                        ¿Olvidaste tu contraseña?
                      </a>
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-cyan-200 to-cyan-600 hover:from-cyan-500 hover:to-cyan-600">
                      Iniciar Sesión
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <CardContent>
                  <CardDescription className="mb-6">
                    Crea tu cuenta de acceso
                  </CardDescription>

                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Alert className="mb-4 border-green-500 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          {successMessage}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Nombre Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="full-name"
                          type="text"
                          placeholder="Juan Pérez"
                          value={registerData.fullName}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, fullName: e.target.value })
                          }
                          className={`pl-10 ${errors.fullName ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                      </div>
                      {errors.fullName && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.fullName}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="usuario@ejemplo.com"
                          value={registerData.email}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, email: e.target.value })
                          }
                          className={`pl-10 ${errors.registerEmail ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                      </div>
                      {errors.registerEmail && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.registerEmail}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-id">ID de Usuario</Label>
                      <Input
                        id="user-id"
                        type="text"
                        placeholder="EST001, DOC001, o ADM001"
                        value={registerData.userId}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, userId: e.target.value })
                        }
                        className={`${errors.userId ? "border-red-500 focus:ring-red-500" : ""}`}
                      />
                      {errors.userId && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.userId}
                        </motion.p>
                      )}
                      
                      {/* Role indicator */}
                      {registerData.userId && currentRole !== "No identificado" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`flex items-center gap-2 p-2 rounded-md border ${getRoleColor(currentRole)}`}
                        >
                          {getRoleIcon(currentRole)}
                          <span className="text-sm">Rol detectado: {currentRole}</span>
                        </motion.div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        El ID determina tu rol: EST (Estudiante), DOC (Docente), ADM (Administrador)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, password: e.target.value })
                          }
                          className={`pl-10 pr-10 ${errors.registerPassword ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.registerPassword && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.registerPassword}
                        </motion.p>
                      )}
                      
                      {/* Password strength indicator */}
                      {registerData.password && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-1"
                        >
                          <div className="flex gap-1">
                            {[1, 2, 3].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-colors ${
                                  level <= passwordStrength.strength ? passwordStrength.color : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-600">
                            Fortaleza: <span className={passwordStrength.color.replace("bg-", "text-")}>{passwordStrength.label}</span>
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.confirmPassword}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-500 text-sm flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          {errors.confirmPassword}
                        </motion.p>
                      )}
                      
                      {/* Password match indicator */}
                      {registerData.confirmPassword && registerData.password === registerData.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-green-600 text-sm flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Las contraseñas coinciden
                        </motion.p>
                      )}
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-cyan-200 to-cyan-600 hover:from-cyan-500 hover:to-cyan-600">
                      Registrarse
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Alert className="backdrop-blur-sm bg-white/80 border-cyan-200">
            <AlertCircle className="h-4 w-4 text-cyan-600" />
            <AlertDescription className="text-gray-700">
              Todos los usuarios pueden registrarse con cualquier correo electrónico válido
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
