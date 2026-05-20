import { http } from "../core/api/http.js";
import { feedStore, messageStore, networkStore, notificationStore, userStore } from "../core/state/stores.js";

export const AppService = {
  async completeOnboarding(payload) {
    await http.post("/onboarding", payload);
    localStorage.setItem("onboarding_complete", "true");
    userStore.setState({ onboardingComplete: true });
  },
  async loadFeed() {
    feedStore.setState({ loading: true });
    const data = await http.get(`/feed?page=${feedStore.getState().page}`);
    feedStore.setState({ posts: data.posts, hasMore: data.hasMore, loading: false });
  },
  async createPost(body) {
    const { post } = await http.post("/posts", { body });
    feedStore.setState({ posts: [post, ...feedStore.getState().posts] });
  },
  async loadNetwork() {
    const data = await http.get("/network/suggestions");
    networkStore.setState(data);
  },
  async loadNotifications() {
    const data = await http.get("/notifications");
    notificationStore.setState(data);
  },
  async loadMessages() {
    const data = await http.get("/messages");
    messageStore.setState({ ...data, activeId: data.conversations[0]?.id });
  },
  async loadProfile(id = "me") {
    const data = await http.get(`/profile/${id}`);
    userStore.setState({ profile: data.profile });
  },
  search(q) {
    return http.get(`/search?q=${encodeURIComponent(q)}`);
  }
};
