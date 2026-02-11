<script>
export default {
  methods: {
    goBack() {
      window.history.back();
    },
  },
};
</script>

<template>
  <v-btn
    @click="goBack"
    variant="flat"
    icon="mdi-arrow-left"
    class="rounded-te rounded-ts rounded-bs"
    color="primary"
  ></v-btn>
  <v-container class="align-center my-10 justify-center" fluid>
    <v-img
      max-width="200"
      class="d-flex align-center mx-auto mb-2 justify-center rounded-lg"
      src="https://static.vecteezy.com/system/resources/previews/059/904/717/non_2x/hand-holding-a-question-mark-symbol-in-a-minimal-flat-design-illustration-vector.jpg"
      alt="404 Not Found"
    >
    </v-img>

    <v-empty-state
      headline="Whoops, 404"
      title="Page not found"
      text="The page you were looking for does not exist"
    ></v-empty-state>
  </v-container>
</template>
<style scoped></style>
