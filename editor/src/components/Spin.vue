<template>
  <div>
    <i class="iconfont icon-loading spin"></i> {{ text }}
  </div>
</template>

<script>

export default {
  props: ['text'],
};

</script>

<style lang="css">
.spin {
  display: inline-block;
  transform-origin: 50% 50%;
  animation: load 0.5s linear infinite;
}

@keyframes load {
  0% {
    transform: rotate(0);
  }

  30% {
    transform: rotate(80deg);
  }

  70% {
    transform: rotate(280deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
