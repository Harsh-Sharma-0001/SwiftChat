// src/store/slices/feedSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchFeed = createAsyncThunk('feed/fetchFeed', async (page = 1, { rejectWithValue, signal }) => {
  try {
    const res = await api.get(`/posts/feed?page=${page}`, { signal });
    return res.data;
  } catch (err) {
    if (err.name === 'CanceledError') {
      return rejectWithValue('aborted');
    }
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch feed');
  }
});

export const toggleLike = createAsyncThunk('feed/toggleLike', async (postId, { rejectWithValue }) => {
  try {
    const res = await api.post('/interactions/like', { postId });
    return { postId, ...res.data.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to like');
  }
});

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    posts: [],
    trending: [],
    pagination: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    addPostToTop: (state, action) => {
      state.posts.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state, action) => {
        if (action.meta.arg === 1) state.status = 'loading'; // Only loading state for first page
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload.pagination.page === 1) {
          state.posts = action.payload.data;
        } else {
          const newPosts = action.payload.data.filter(p => !state.posts.find(existing => existing.id === p.id));
          state.posts = [...state.posts, ...newPosts];
        }
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.posts.find(p => p.id === action.payload.postId);
        if (post) {
          post.isLiked = action.payload.liked;
          post._count.likes = action.payload.likeCount;
        }
      });
  },
});

export const { addPostToTop } = feedSlice.actions;
export default feedSlice.reducer;
