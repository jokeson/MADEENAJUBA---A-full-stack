"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import SignUpModal from "./SignUpModal";
import LoginModal from "./LoginModal";

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
   * Switches from sign up modal to login modal.
   * Closes the sign up modal and opens the login modal.
   * Called when user clicks "Login" link in the sign up modal.
   */
  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false);
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
      />
    </>
  );
};

export default NavbarWrapper;

