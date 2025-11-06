import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';

function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup, login, loginWithGoogle, resetPassword, deleteUnverifiedUserAndSignup, currentUser } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
      console.error(err);
      setLoading(false);
    }
  };

  const handleRetrySignup = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const result = await deleteUnverifiedUserAndSignup(
        emailRef.current.value,
        passwordRef.current.value,
        nameRef.current.value
      );
      
      if (result.success) {
        setMessage('¡Registro exitoso! Revisa tu correo para verificar tu cuenta y poder iniciar sesión.');
        setIsLoginView(true);
        passwordRef.current.value = '';
        passwordConfirmRef.current.value = '';
        nameRef.current.value = '';
        emailRef.current.value = '';
      }
    } catch (err) {
      console.error("Error en retry signup:", err);
      
      if (err.message === 'USER_ALREADY_VERIFIED') {
        setError('Este correo ya está registrado y verificado. Por favor, inicia sesión.');
        setIsLoginView(true);
      } else if (err.message === 'WRONG_PASSWORD') {
        setError('Ya existe una cuenta con este correo pero la contraseña no coincide. Si es tu cuenta, inicia sesión con la contraseña correcta o usa la opción de recuperación.');
      } else if (err.message.startsWith('WAIT_TIME_')) {
        const minutesRemaining = err.message.split('_')[2];
        setError(
          `Debes esperar ${minutesRemaining} minuto${minutesRemaining > 1 ? 's' : ''} más desde tu registro inicial antes de poder crear una nueva cuenta con este correo. Por favor, verifica tu correo o intenta más tarde.`
        );
      } else {
        setError('Error al procesar el registro. Por favor, intenta nuevamente.');
      }
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isLoginView) {
      try {
        await login(emailRef.current.value, passwordRef.current.value);
        navigate('/');
      } catch (err) { 
        if (err.message === 'email-not-verified') {
          setError(
            <span>
              Tu correo no ha sido verificado. Por favor, revisa tu bandeja de entrada o{' '}
              <button type="button" className="link-button" onClick={handleResendVerification}>
                reenvía el correo
              </button>.
            </span>
          );
        } else {
          setError('Error al iniciar sesión. Verifica tu correo y contraseña.');
        }
      }
    } else {
      if (passwordRef.current.value !== passwordConfirmRef.current.value) {
        setLoading(false);
        return setError('Las contraseñas no coinciden.');
      }

      try {
        const password = passwordRef.current.value;
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        
        if (!passwordRegex.test(password)) {
          setLoading(false);
          return setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.');
        }

        const result = await signup(emailRef.current.value, password, nameRef.current.value);
        
        if (result.success) {
          setMessage('¡Registro exitoso! Revisa tu correo para verificar tu cuenta y poder iniciar sesión.');
          setIsLoginView(true);
          passwordRef.current.value = '';
          passwordConfirmRef.current.value = '';
          nameRef.current.value = '';
          emailRef.current.value = '';
        }
      } catch (err) {
        console.error("Error en registro:", err);
        
        if (err.message === 'EMAIL_IN_USE') {
          setError(
            <span>
              Este correo ya se encuentra registrado pero no verificado.{' '}
              <button 
                type="button" 
                className="link-button" 
                onClick={handleRetrySignup}
                disabled={loading}
              >
                Haz clic aquí para continuar.
              </button>
            </span>
          );
        } else if (err.message === 'INVALID_EMAIL') {
          setError('El formato del correo electrónico no es válido.');
        } else if (err.message === 'WEAK_PASSWORD') {
          setError('La contraseña es demasiado débil. Debe tener al menos 8 caracteres.');
        } else {
          setError('Error al crear la cuenta. Por favor, intenta nuevamente.');
        }
      }
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    const email = emailRef.current.value;
    if (!email) {
      return setError('Por favor, ingresa tu correo para restablecer la contraseña.');
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Revisa tu correo para las instrucciones de restablecimiento.');
    } catch (err) {
      setError('Error al enviar el correo de restablecimiento.');
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const userCredential = await login(emailRef.current.value, passwordRef.current.value, true);
      await sendEmailVerification(userCredential.user);
      setMessage('Se ha reenviado el correo de verificación. Por favor, revisa tu bandeja de entrada.');
    } catch (err) {
      console.error("Error al reenviar correo:", err);
      setError('No se pudo reenviar el correo. Verifica tus credenciales.');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isLoginView ? 'Iniciar Sesión' : 'Registrarse'}</h2>
        
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        
        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <div className="form-group">
              <label htmlFor="name">Nombre</label>
              <input 
                type="text" 
                id="name" 
                ref={nameRef} 
                required 
                disabled={loading}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Correo</label>
            <input 
              type="email" 
              id="email" 
              ref={emailRef} 
              required 
              disabled={loading}
            />
            {!isLoginView && (
              <p className="password-requirement">
                Te enviaremos un enlace de confirmación a este correo.
              </p>
            )}
          </div>
          
          <div className="form-group password-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              ref={passwordRef} 
              required 
              disabled={loading}
            />
            <button 
              type="button" 
              className="password-toggle" 
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              onMouseLeave={() => setShowPassword(false)}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
              </svg>
            </button>
          </div>
          
          {!isLoginView && (
            <div className="form-group password-group">
              <label htmlFor="password-confirm">Confirmar Contraseña</label>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password-confirm" 
                ref={passwordConfirmRef} 
                required 
                disabled={loading}
              />
              <p className="password-requirement">
                Mínimo 8 caracteres incluye una mayúscula, un número y un símbolo.
              </p>
            </div>
          )}
          
          <button disabled={loading} className="button-primary" type="submit">
            {loading ? 'Cargando...' : (isLoginView ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>
        
        <div className="login-divider"><span>O</span></div>
        
        <button onClick={handleGoogleSignIn} className="button-google" disabled={loading}>
          <svg className="google-logo" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          {loading ? 'Cargando...' : 'Continuar con Google'}
        </button>
        
        <div className="login-footer">
          {isLoginView ? (
            <>
              <button 
                type="button" 
                className="link-button" 
                onClick={handlePasswordReset}
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <p>
                ¿No tienes una cuenta?{' '}
                <button 
                  type="button" 
                  className="link-button" 
                  onClick={() => {
                    setIsLoginView(false);
                    setMessage('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  Regístrate
                </button>
              </p>
            </>
          ) : (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <button 
                type="button" 
                className="link-button" 
                onClick={() => {
                  setIsLoginView(true);
                  setMessage('');
                  setError('');
                }}
                disabled={loading}
              >
                Inicia Sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;