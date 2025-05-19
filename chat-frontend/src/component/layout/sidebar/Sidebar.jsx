import { useState } from "react";
import PageIndex from "../../../container/PageIndex";
import Index from "../../../container/Index";
import ProfileDrawer from "../../profileDrawer/ProfileDrawer";

const Sidebar = () => {
  const { isDarkMode, toggleTheme, setUserProfile, setSelectedChat } =
    PageIndex.useAppContext();
  const navigate = PageIndex.useNavigate();
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const handleProfileDrawer = () => setOpenProfile(!openProfile);
  const handleLogoutClick = () => {
    setOpenLogoutModal(true);
  };

  const handleCloseModal = () => {
    setOpenLogoutModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserProfile(null);
    setSelectedChat(null);
    navigate("/login");
    handleCloseModal();
  };

  return (
    <>
      <Index.Drawer variant="permanent" className="sidebar-drawer">
        <Index.Box className="sidebar-container">
          <Index.Box className="sidebar-top">
            <Index.Tooltip arrow title="Profile" placement="right">
              <Index.IconButton onClick={handleProfileDrawer}>
                <Index.AccountCircle />
              </Index.IconButton>
            </Index.Tooltip>
          </Index.Box>

          <Index.Box className="sidebar-bottom">
            <Index.Tooltip arrow title="Log out" placement="right">
              <Index.IconButton onClick={handleLogoutClick}>
                <Index.LogoutIcon />
              </Index.IconButton>
            </Index.Tooltip>
            {/* Theme toggle button disabled for now */}
            {/* <Index.Tooltip
              arrow
              title={isDarkMode ? "Light mode" : "Dark mode"}
              placement="right"
            >
              <Index.IconButton
                onClick={toggleTheme}
                aria-label="toggle dark mode"
              >
                {isDarkMode ? <Index.LightMode /> : <Index.DarkMode />}
              </Index.IconButton>
            </Index.Tooltip> */}
          </Index.Box>
        </Index.Box>
      </Index.Drawer>
      <ProfileDrawer open={openProfile} handleClose={handleProfileDrawer} />
      <Index.Modal
        open={openLogoutModal}
        onClose={handleCloseModal}
        aria-labelledby="logout-modal"
        aria-describedby="logout-confirmation"
      >
        <Index.Box className="logout-modal">
          <Index.Typography
            id="logout-modal"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Confirm Logout
          </Index.Typography>
          <Index.Typography id="logout-confirmation" className="logout-message">
            Are you sure you want to log out?
          </Index.Typography>
          <Index.Box className="logout-actions">
            <Index.IconButton onClick={handleCloseModal} color="primary">
              <Index.Close />
            </Index.IconButton>
            <Index.IconButton onClick={handleLogout} color="error">
              <Index.LogoutIcon />
            </Index.IconButton>
          </Index.Box>
        </Index.Box>
      </Index.Modal>
    </>
  );
};

export default Sidebar;
