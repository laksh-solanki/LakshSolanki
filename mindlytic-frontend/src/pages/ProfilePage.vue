<template>
  <v-container class="py-10">

    <v-row>

      <v-col cols="12" md="4">
        <v-card class="rounded-lg text-center pb-3" elevation="10" border>
          <v-img height="160" src="https://cdn.vuetifyjs.com/images/cards/server-room.jpg" cover
            class="d-flex justify-center align-center">
            <v-avatar size="120" class="border-lg border-background" z-index="10000"
              :image="my_photo"></v-avatar>
          </v-img>

          <div class="mt-10">
            <h2 class="text-h5 font-weight-bold">Laksh Solanki</h2>
            <p class="text-medium-emphasis mb-4">Senior Full-Stack Engineer</p>

            <div class="d-flex justify-center gap-2 mb-6">
              <v-btn color="grey" variant="tonal" rounded="lg" icon="mdi-email-outline"></v-btn>
              <v-btn color="grey" variant="tonal" rounded="lg" icon="mdi-dots-horizontal"></v-btn>
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="d-flex justify-space-around mb-4">
              <div>
                <div class="text-h6 font-weight-bold">82</div>
                <div class="text-caption text-medium-emphasis">Projects</div>
              </div>
              <div>
                <div class="text-h6 font-weight-bold">14k</div>
                <div class="text-caption text-medium-emphasis">Commits</div>
              </div>
              <div>
                <div class="text-h6 font-weight-bold">4.9</div>
                <div class="text-caption text-medium-emphasis">Rating</div>
              </div>
            </div>

            <v-divider class="mb-4"></v-divider>

            <v-list density="compact" nav class="text-left">
              <v-list-item prepend-icon="mdi-map-marker-outline" title="Gujarat, India" class="text-body-2"></v-list-item>
              <v-list-item prepend-icon="mdi-web" title="https://mindlytic.onrender.com/"
                target="_blank" class="text-body-2"></v-list-item>
              <v-list-item prepend-icon="mdi-github" title="github.com/laksh-solanki" href="https://github.com/laksh-solanki"
                target="_blank" class="text-body-2 text-blue"></v-list-item>
              <v-list-item prepend-icon="mdi-twitter" title="@laksh_solanki" class="text-body-2"></v-list-item>
            </v-list>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="rounded-lg pa-2" elevation="10" border>
          <v-tabs inset v-model="tab" color="primary" align-tabs="start" slider-color="white" class="mb-6 border-b">
            <v-tab value="edit" class="text-capitalize">Edit Profile</v-tab>
            <v-tab value="stack" class="text-capitalize">Tech Stack</v-tab>
            <v-tab value="security" class="text-capitalize">Security</v-tab>
          </v-tabs>

          <v-window v-model="tab" class="ma-4">
            <v-window-item value="edit">
              <p class="text-h6 font-weight-bold mb-1">General Information</p>
              <p class="text-caption text-medium-emphasis mb-6">Update your personal details here.</p>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field label="First Name" variant="outlined" density="comfortable" color="primary"
                    v-model="form.firstName"></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="Last Name" variant="outlined" density="comfortable" color="primary"
                    v-model="form.lastName"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field label="Headline / Role" variant="outlined" density="comfortable" color="primary"
                    v-model="form.role"></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea label="Bio" variant="outlined" rows="3" color="primary" v-model="form.bio"
                    hint="Brief description for your profile."></v-textarea>
                </v-col>
              </v-row>

              <div class="d-flex justify-end mt-4">
                <v-btn color="primary" size="large" variant="flat" class="text-capitalize">Save Changes</v-btn>
              </div>
            </v-window-item>

            <v-window-item value="stack">
              <p class="text-h6 font-weight-bold mb-4">Skills & Technologies</p>

              <div class="mb-6">
                <v-chip-group column>
                  <v-chip v-for="skill in skills" :key="skill" closable @click:close="removeSkill(skill)"
                    color="primary" variant="tonal" class="font-weight-bold">
                    {{ skill }}
                  </v-chip>
                </v-chip-group>
              </div>

              <v-divider class="mb-6"></v-divider>

              <v-text-field v-model="newSkill" label="Add a skill (e.g. Docker)" variant="outlined"
                append-inner-icon="mdi-plus" @click:append-inner="addSkill" @keyup.enter="addSkill"></v-text-field>
            </v-window-item>

            <v-window-item value="security">
              <p class="text-h6 font-weight-bold mb-4">Password & Security</p>

              <v-list bg-color="transparent">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-4">mdi-lock-outline</v-icon>
                  </template>
                  <v-list-item-title>Change Password</v-list-item-title>
                  <v-list-item-subtitle>Last changed 3 months ago</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn variant="outlined" size="small">Update</v-btn>
                  </template>
                </v-list-item>

                <v-divider class="my-3"></v-divider>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-4">mdi-shield-check-outline</v-icon>
                  </template>
                  <v-list-item-title>Two-Factor Authentication</v-list-item-title>
                  <v-list-item-subtitle class="text-success">Enabled</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-switch color="success" model-value="true" hide-details density="compact"></v-switch>
                  </template>
                </v-list-item>
              </v-list>

              <v-alert color="error" variant="tonal" icon="mdi-alert-circle-outline" title="Delete Account"
                class="mt-6">
                <div class="text-caption mb-4">Once you delete your account, there is no going back. Please be
                  certain.</div>
                <v-btn color="error" variant="flat" size="small">Delete Account</v-btn>
              </v-alert>
            </v-window-item>

          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import my_photo from "@/assets/Picture/my-pic.jpg";

const tab = ref('edit')

const form = ref({
  firstName: 'Laksh',
  lastName: 'Solanki',
  role: 'Senior Full-Stack Engineer',
  bio: 'Passionate about building scalable web applications with Vue and Node.js. Open source contributor and coffee enthusiast.'
})

const skills = ref(['Vue.js', 'Vuetify', 'Node.js', 'TypeScript', 'Firebase', 'AWS'])
const newSkill = ref('')

const removeSkill = (skill) => {
  skills.value = skills.value.filter(s => s !== skill)
}

const addSkill = () => {
  if (newSkill.value) {
    skills.value.push(newSkill.value)
    newSkill.value = ''
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

/* Custom thick border for the avatar to cut into the cover image */
.border-lg {
  border: 4px solid rgb(var(--v-theme-background));
}
</style>
