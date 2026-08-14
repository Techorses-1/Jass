import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.scss';
import 'react-toastify/dist/ReactToastify.css';
// import logo from "../../../Assets/logo/bg_logo.png";
// import logo from "../../../Assets/logo/th_logo.png"; 
import logo from "../../../Assets/logo/jass_logo.png"

// import logo from "../../../Assets/logo/th.png";  


const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      password: ''
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be 50 characters or less')
        .required('Name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      phone: Yup.string()
        .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
        .required('Phone number is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);

        // Call register API
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, values);

        // Show success toast
        toast.success('Successful! Redirecting to login...', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);

      } catch (error) {
        console.error('Registration error:', error);

        let errorMessage = 'Registration failed';
        if (error.response) {
          errorMessage = error.response.data.message || errorMessage;
        }

        // Show error toast
        toast.error(errorMessage, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="register-container">
      <ToastContainer />
      <div className="register-wrapper">
        {/* LEFT: form section (previously on right in login) */}
        <div className="register-left">
          {/* decorative rectangle behind the glass card */}
          <div className="form-bg" aria-hidden="true" />

          {/* the translucent glass card with the actual form */}
          <div className="glass-card">
            <h2 className="register-title">Create Account</h2>
            <p className="register-subtitle">Join us today!</p>

            <form onSubmit={formik.handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <FiUser className="input-icon" />
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.name}
                  className={`form-input ${formik.touched.name && formik.errors.name ? 'error' : ''}`}
                />
                {formik.touched.name && formik.errors.name ? (
                  <div className="error-message">{formik.errors.name}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <FiMail className="input-icon" />
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                  className={`form-input ${formik.touched.email && formik.errors.email ? 'error' : ''}`}
                />
                {formik.touched.email && formik.errors.email ? (
                  <div className="error-message">{formik.errors.email}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  <FiPhone className="input-icon" />
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.phone}
                  className={`form-input ${formik.touched.phone && formik.errors.phone ? 'error' : ''}`}
                />
                {formik.touched.phone && formik.errors.phone ? (
                  <div className="error-message">{formik.errors.phone}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <FiLock className="input-icon" />
                  Password
                </label>
                <div className="password-input-container">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    className={`form-input ${formik.touched.password && formik.errors.password ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password ? (
                  <div className="error-message">{formik.errors.password}</div>
                ) : null}
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </form>

            <div className="switch-auth">
              Already have an account?
              <button
                onClick={handleSwitchToLogin}
                className="switch-button"
              >
                Login here
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: welcome text (previously on left in login) */}
        <div className="register-right">
          <div className="right-inner">
            <img src={logo} alt="Logo" className="left-logo" />
            <h1 className="welcome-title">Welcome!</h1>
            <div className="divider" />
            <p className="welcome-desc">
              Begin your journey with the company’s inventory portal. From purchase orders to sales, handle every process with ease and accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;