import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const sendMessageAPI: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMessages: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const saveMessage: (content: string, userId: string, username: string, recipientId?: string) => Promise<any>;
//# sourceMappingURL=messageController.d.ts.map