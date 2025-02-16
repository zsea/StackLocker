import store from '../store';

let lastEarnedFeatureIds = null;
let debounceTimeoutId;

const showInfo = () => {
  const earnedBadges = store.getters['data/allBadges']
    .filter(badge => badge.isEarned && !lastEarnedFeatureIds.has(badge.featureId));
  if (earnedBadges.length) {
    store.dispatch('notification/badge', earnedBadges.length > 1
      ? `您已获得 ${earnedBadges.length} 个徽章: ${earnedBadges.map(badge => `"${badge.name}"`).join(', ')}.`
      : `您已获得 1 个徽章: "${earnedBadges[0].name}".`);
  }
  lastEarnedFeatureIds = null;
};

export default {
  addBadge(featureId) {
    // 通过设置一个永远为false的条件来屏蔽掉Badge功能
    if (Date.now() < 0 && !store.getters['data/badgeCreations'][featureId]) {
      if (!lastEarnedFeatureIds) {
        const earnedFeatureIds = store.getters['data/allBadges']
          .filter(badge => badge.isEarned)
          .map(badge => badge.featureId);
        lastEarnedFeatureIds = new Set(earnedFeatureIds);
      }

      store.dispatch('data/patchBadgeCreations', {
        [featureId]: {
          created: Date.now(),
        },
      });

      clearTimeout(debounceTimeoutId);
      debounceTimeoutId = setTimeout(() => showInfo(), 5000);
    }
  },
};
