import jwt from "jsonwebtoken";

/**
 * Authentication Middleware
 * 
 * Prüft ob ein gültiges JWT im Authorization-Header vorhanden ist.
 * Bei Erfolg wird req.user mit den dekodierten Benutzerdaten befüllt.
 * 
 * Authorization Header Format: "Bearer <token>"
 */
function authenticate(req, res, next) {
  // 1. Authorization-Header auslesen
  const authHeader = req.headers.authorization;

  // 2. Prüfen ob Header vorhanden und Format korrekt
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Kein Token vorhanden. Bitte einloggen." });
  }

  // 3. Token extrahieren (alles nach "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // 4. Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Benutzerdaten in req.user speichern
    req.user = decoded;

    // Weiter zur nächsten Middleware / Route
    next();
  } catch (error) {
    // 6. Fehlerbehandlung: Token abgelaufen oder manipuliert
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token abgelaufen. Bitte erneut einloggen." });
    }
    return res.status(401).json({ error: "Ungültiges Token." });
  }
}

export default authenticate;