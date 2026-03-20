/**
 * Authorization Middleware (Role-Based Access Control)
 * 
 * Erstellt eine Middleware die prüft, ob der authentifizierte User
 * eine der erlaubten Rollen hat.
 * 
 * Verwendung: authorize("admin", "user")
 * 
 * WICHTIG: Muss NACH authenticate() verwendet werden!
 * 
 * 401 Unauthorized  = Nicht authentifiziert (Wer bist du?)
 * 403 Forbidden     = Authentifiziert, aber nicht autorisiert (Du darfst das nicht!)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    // 1. Wurde der User authentifiziert?
    if (!req.user) {
      return res.status(401).json({ error: "Nicht authentifiziert." });
    }

    // 2. Hat der User eine erlaubte Rolle?
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Keine Berechtigung für diese Aktion." });
    }

    // 3. Alles ok, weiter zur nächsten Middleware / Route
    next();
  };
}

export default authorize;