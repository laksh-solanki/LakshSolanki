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
.certificate-wrapper {
  width: min(100%, 794px);
  margin: 0 auto;
  padding-inline: clamp(8px, 1.4vw, 16px);
  font-family: "Open Sans", "Segoe UI", sans-serif;
  color: #222;
}

.figure {
  display: block;
  margin: 0;
}

.logo-section {
  margin-top: clamp(44px, 9vw, 155px);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-section .partner-logo {
  padding-right: clamp(14px, 2vw, 30px);
  margin-right: clamp(14px, 2vw, 30px);
  position: relative;
}

.logo-section .partner-logo:before {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: clamp(56px, 12vw, 100px);
  background-color: #707070;
  opacity: 0.5;
}

.logo-section .partner-logo .figure {
  width: auto;
  height: clamp(52px, 10vw, 85px);
}

.logo-section .edutech-logo {
  width: clamp(112px, 22vw, 175px);
  height: clamp(52px, 10vw, 85px);
  position: relative;
}

.common-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: left;
}

.certificate-heading {
  font-family: "Open Sans", "Segoe UI", sans-serif;
  font-size: clamp(1.15rem, 4.1vw, 34px);
  font-weight: 700;
  color: #222;
  line-height: 1.2;
  text-transform: uppercase;
  margin: clamp(20px, 4vw, 50px) auto 0;
  text-align: center;
  width: min(100%, 16cm);
}

.name-content {
  width: min(100%, 16cm);
  margin: clamp(20px, 4vw, 50px) auto clamp(18px, 3.5vw, 40px);
  border-top: 2px solid #222;
  border-bottom: 2px solid #222;
}

.name-content p {
  font-family: "Poppins", "Segoe UI", sans-serif;
  font-size: clamp(1.2rem, 4.8vw, 40px);
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  text-transform: uppercase;
  margin: clamp(8px, 1.8vw, 17px) 0;
  letter-spacing: clamp(0.2px, 0.15vw, 1px);
  overflow-wrap: anywhere;
}

.content-body {
  width: min(100%, 18cm);
  margin: 0 auto clamp(28px, 5vw, 60px);
  text-align: center;
}

.content-body p {
  font-family: "Poppins", "Segoe UI", sans-serif;
  font-size: clamp(0.95rem, 2.7vw, 24px);
  font-weight: 400;
  line-height: 1.5;
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

.footer-section {
  display: block;
}

.signatures {
  width: min(100%, 16cm);
  margin: clamp(14px, 2.8vw, 30px) auto 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}

.signatures .left,
.signatures .right {
  width: clamp(104px, 25%, 145px);
}

.signatures .prof-logo .figure {
  width: clamp(92px, 22vw, 135px);
  margin: 0 auto;
}

.signatures .right .figure {
  width: clamp(92px, 22vw, 135px);
  margin: 0 auto;
}

.signatures .figure img {
  width: 100%;
}

.signer-name {
  font-family: "Poppins", "Segoe UI", sans-serif;
  font-size: clamp(0.66rem, 2.1vw, 18px);
  font-weight: 800;
  line-height: normal;
  margin: 0;
  text-align: center;
  overflow-wrap: anywhere;
}

.signer-title {
  font-family: "Poppins", "Segoe UI", sans-serif;
  font-size: clamp(0.56rem, 1.7vw, 15px);
  font-weight: 400;
  line-height: 1.35;
  border-top: 1px solid #222;
  text-align: center;
  margin-top: 3px;
  padding-top: 6px;
}

.signer-title span {
  display: block;
  font-weight: 700;
}

.lnt-section {
  width: min(100%, 17cm);
  margin: clamp(18px, 4vw, 40px) auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lnt-section .border-line {
  width: calc(100% - clamp(58px, 12vw, 75px));
}

.lnt-section .border-line > div {
  border: 1px solid #222;
  width: 100%;
  display: block;
}

.lnt-section .logo-small {
  width: clamp(46px, 8vw, 60px);
  margin-left: clamp(10px, 2vw, 20px);
}

.lnt-section .logo-small img {
  width: 100%;
}

@media (max-width: 600px) {
  .certificate-wrapper {
    padding-inline: 10px;
  }

  .logo-section {
    margin-top: 30px;
  }

  .content-body p {
    line-height: 1.45;
  }
}
</style>
