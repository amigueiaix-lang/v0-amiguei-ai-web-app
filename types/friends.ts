export interface Friend {
  friend_id: string
  created_at: string
  friend: {
    id: string
    name: string
    email: string
    username: string
  }
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender?: {
    id: string
    name: string
    email: string
    username: string
  }
  receiver?: {
    id: string
    name: string
    email: string
    username: string
  }
}

export interface UserSearchResult {
  id: string
  name: string
  email: string
  username: string
  status: 'none' | 'pending' | 'friends'
  sentByMe?: boolean
}
