"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import SignUpModal from "./SignUpModal";
import LoginModal from "./LoginModal";
import ForgotPasswordModal from "./ForgotPasswordModal";

/**
 * NavbarWrapper Component
 * A wrapper component that manages the navbar and authentication modals (login and sign up).
 * Handles the state and interactions between the navbar and modal dialogs.
 */
const NavbarWrapper = () => {
  // State to control the visibility of the sign up modal
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  // State to control the visibility of the login modal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // State to control the visibility of the forgot password modal
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  /**
   * Opens the sign up modal by setting its state to true.
   * Called when user clicks the sign up button in the navbar.
   */
  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  /**
   * Closes the sign up modal by setting its state to false.
   * Called when user closes the sign up modal (via close button or backdrop click).
   */
  const handleCloseSignUpModal = () => {
    setIsSignUpModalOpen(false);
  };

  /**
   * Opens the login modal by setting its state to true.
   * Called when user clicks the login button in the navbar.
   */
  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  /**
   * Closes the login modal by setting its state to false.
   * Called when user closes the login modal (via close button or backdrop click).
   */
  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  /**
   * Switches to login modal from any other modal.
   * Closes all other modals and opens the login modal.
   * Called when user clicks "Login" link in sign up or forgot password modals.
   */
  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false);
    setIsForgotPasswordModalOpen(false);
    setIsLoginModalOpen(true);
  };

  /**
   * Switches from login modal to sign up modal.
   * Closes the login modal and opens the sign up modal.
   * Called when user clicks "Sign Up" link in the login modal.
   */
  const handleSwitchToSignUp = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
  };

  /**
   * Opens the forgot password modal by setting its state to true.
   * Called when user clicks "Forgot password?" link in the login modal.
   */
  const handleOpenForgotPasswordModal = () => {
    setIsForgotPasswordModalOpen(true);
  };

  /**
   * Closes the forgot password modal by setting its state to false.
   * Called when user closes the forgot password modal (via close button or backdrop click).
   */
  const handleCloseForgotPasswordModal = () => {
    setIsForgotPasswordModalOpen(false);
  };

  return (
    <>
      <Navbar
        onOpenLoginModal={handleOpenLoginModal}
        onOpenSignUpModal={handleOpenSignUpModal}
      />
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={handleCloseSignUpModal}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onSwitchToSignUp={handleSwitchToSignUp}
        onSwitchToForgotPassword={handleOpenForgotPasswordModal}
      />
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={handleCloseForgotPasswordModal}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};

export default NavbarWrapper;

