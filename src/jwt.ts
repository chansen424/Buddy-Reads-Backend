import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

interface LocalUser {
  id: string;
  username: string;
}

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) {
        res.sendStatus(403);
      }

      req.user = user as LocalUser;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export default authenticateJWT;
