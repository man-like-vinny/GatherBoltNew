require("dotenv").config();

const {KindeClient, GrantType} = require("@kinde-oss/kinde-nodejs-sdk");

const options = {
    domain: process.env.KINDE_DOMAIN,
    clientId: process.env.KINDE_CLIENT_ID,
    clientSecret: process.env.KINDE_CLIENT_SECRET,
    redirectUri: process.env.KINDE_REDIRECT_URI,
    logoutRedirectUri: process.env.KINDE_LOGOUT_REDIRECT_URI,
    grantType: GrantType.PKCE
};

app.get("/login", kindeClient.login(), (req, res) => {
    return res.redirect("/");
});

app.get("/register", kindeClient.register(), (req, res) => {
    return res.redirect("/");
});