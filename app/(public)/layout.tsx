import NavbarWrapper from "../../components/NavbarWrapper";
import MaintenanceNotification from "../../components/MaintenanceNotification";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <MaintenanceNotification />
      {children}
    </>
  );
}

