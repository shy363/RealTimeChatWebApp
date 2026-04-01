import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const searchUsers: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addContact: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getContacts: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const inviteByCode: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const acceptContact: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=contactController.d.ts.map