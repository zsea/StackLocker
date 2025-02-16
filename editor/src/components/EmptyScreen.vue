<template>
  <div class="empty-screen">
    <splash-screen></splash-screen>
  </div>
</template>
<script>
import SplashScreen from './SplashScreen';

export default {
  components: {
    SplashScreen,
  },
};
</script>
<style lang="css">
.empty-screen {
  position: relative;
  height: 100%;
}
</style>
