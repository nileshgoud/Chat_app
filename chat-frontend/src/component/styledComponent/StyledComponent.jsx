import Index from "../../container/Index";

export const StyledBadge = Index.styled(Index.Badge)(({ theme, color }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: color === "success" ? "#44b700" : "#f44336",
    color: color === "success" ? "#44b700" : "#f44336",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: "1px solid currentColor",
      content: '""',
    },
  },
}));
