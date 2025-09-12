import express from 'express'
import { authenticateToken } from '../middleware/auth.middleware'
import {
  createPrivateRoom,
  getPrivateRooms,
  getPrivateRoom,
  joinPrivateRoom,
  leavePrivateRoom,
  updatePrivateRoom,
  deletePrivateRoom,
  getRoomMembers,
  inviteToRoom,
  removeFromRoom,
  verifyRoomPassword
} from '../controllers/private-room.controller'

const router = express.Router()

// Apply auth middleware to all routes (temporarily disabled for testing)
// router.use(authenticateToken)

// Room management
router.post('/', createPrivateRoom)
router.get('/', getPrivateRooms)
router.get('/:roomId', getPrivateRoom)
router.put('/:roomId', updatePrivateRoom)
router.delete('/:roomId', deletePrivateRoom)

// Room membership
router.post('/:roomId/join', joinPrivateRoom)
router.post('/:roomId/leave', leavePrivateRoom)
router.get('/:roomId/members', getRoomMembers)

// Member management (for room owners/moderators)
router.post('/:roomId/invite', inviteToRoom)
router.delete('/:roomId/members/:userId', removeFromRoom)

// Password verification for locked chat rooms
router.post('/verify-password', verifyRoomPassword)

export default router