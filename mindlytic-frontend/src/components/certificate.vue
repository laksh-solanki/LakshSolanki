<script setup>
defineProps({
  form: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="certificate-wrapper">
    <div class="logo-section">
      <div class="partner-logo common-logo">
        <div class="figure">
          <img src="/src/assets/Picture/sk.jfif" alt="Partner Logo" />
        </div>
      </div>
      <div class="figure edutech-logo common-logo">
        <img src="/src/assets/Picture/L&T EduTech.png" alt="EduTech Logo" />
      </div>
    </div>

    <p class="certificate-heading text-center">
      Certificate of Course <br />
      Pathway Completion
    </p>

    <div class="name-content">
      <p>{{ form.fname }}</p>
    </div>

    <div class="content-body">
      <p>
        has completed the Course pathway titled
        <br />
        <span class="font-weight-bold">{{ form.course.name }}</span>
        <br />
        which covers
        <br />
        <em>7</em>
        courses and
        <em>13</em>
        learning hours
      </p>
    </div>

    <footer class="footer-section">
      <div class="signatures">
        <div class="left prof-logo">
          <div class="figure text-center">
            <img
              src="/src/assets/Picture/profSignature.png"
              alt="Provost Signature"
            />
          </div>
          <p class="signer-name">Prof. (Dr.) Prafulkumar Udani</p>
          <p class="signer-title">
            Provost
            <span>Sankalchand Patel University</span>
          </p>
        </div>
        <div class="right">
          <div class="figure text-center">
            <img src="/src/assets/Picture/febinsign.png" alt="Head Signature" />
          </div>
          <p class="signer-name">M.F.Febin</p>
          <p class="signer-title">Head <span>L&T EduTech</span></p>
        </div>
      </div>

      <div class="lnt-section">
        <div class="border-line">
          <div></div>
        </div>
        <div class="figure logo-small">
          <img src="/src/assets/Picture/LnT.png" alt="L&T Logo" />
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Main Wrapper to isolate print styles */
.certificate-wrapper {
  width: 100%;
  font-family: "Open Sans", sans-serif;
  color: #222;
}

.figure {
  display: block;
  margin: 0;
}

/* Logo Section */
.logo-section {
  margin-top: 155px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-section .partner-logo {
  padding-right: 30px;
  margin-right: 30px;
  position: relative;
}

.logo-section .partner-logo:before {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 100px;
  background-color: #707070;
  opacity: 0.5;
}

.logo-section .partner-logo .figure {
  width: auto;
  height: 85px;
}

.logo-section .edutech-logo {
  width: 175px;
  height: 85px;
  position: relative;
}

.common-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: left;
}

/* Heading */
.certificate-heading {
  font-family: "Open Sans", sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: #222;
  line-height: 38px;
  text-transform: uppercase;
  margin: 50px auto 0;
  text-align: center;
  width: 16cm;
}

/* Name Section */
.name-content {
  width: 16cm;
  margin: 50px auto 40px;
  border-top: 2px solid #222;
  border-bottom: 2px solid #222;
}

.name-content p {
  font-family: "Poppins", sans-serif;
  font-size: 40px;
  font-weight: 700;
  text-align: center;
  line-height: 46px;
  text-transform: uppercase;
  margin: 17px 0;
  letter-spacing: 1px;
}

/* Content Body */
.content-body {
  width: 18cm;
  margin: 0 auto 60px;
  text-align: center;
}

.content-body p {
  font-family: "Poppins", sans-serif;
  font-size: 24px;
  font-weight: 400;
  line-height: 36px;
  width: 100%;
  margin: 0;
}

.content-body p span {
  font-weight: 800;
}

.content-body p em {
  font-style: normal;
  font-weight: 800;
}

/* Footer & Signatures */
.footer-section {
  display: block;
}

.signatures {
  width: 16cm;
  margin: 30px auto 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.signatures .left {
  width: 125px;
}

.signatures .prof-logo .figure {
  width: 135px;
  margin: 0 auto;
}

.signatures .right .figure {
  width: 135px;
  margin: 0 auto;
}

.signatures .figure img {
  width: 100%;
}

.signer-name {
  font-family: "Poppins", sans-serif;
  font-size: 18px;
  font-weight: 800;
  line-height: normal;
  margin: 0;
  text-align: center;
}

.signer-title {
  font-family: "Poppins", sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  border-top: 1px solid #222;
  text-align: center;
  margin-top: 3px;
  padding-top: 6px;
}

.signer-title span {
  display: block;
  font-weight: 700;
}

/* L&T Section */
.lnt-section {
  width: 17cm;
  margin: 40px auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lnt-section .border-line {
  width: calc(100% - 75px);
}

.lnt-section .border-line > div {
  border: 1px solid #222;
  width: 100%;
  display: block;
}

.lnt-section .logo-small {
  width: 60px;
  margin-left: 20px;
}

.lnt-section .logo-small img {
  width: 100%;
}
</style>
