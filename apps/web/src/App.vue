<script setup lang="ts">
import SiteHeader from './components/SiteHeader.vue'
import HeroSection from './components/HeroSection.vue'
import ServicesSection from './components/ServicesSection.vue'
import TeamSection from './components/TeamSection.vue'
import BookingWizard from './components/BookingWizard.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <SiteHeader />
  <main>
    <HeroSection />
    <ServicesSection />
    <TeamSection />
    <BookingWizard />
  </main>
  <SiteFooter />
</template>
