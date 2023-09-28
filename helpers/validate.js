const validator = require("validator");

const validateRegister = (params) => {
  const errors = {};

  // Validación del nombre (si es requerido)
  if (!params.name) {
    errors.name = "El nombre es obligatorio";
  } else if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]{3,}$/.test(params.name)) {
    errors.name =
      "El nombre debe tener al menos tres letras y no contener números ni caracteres especiales";
  }

  // Validación del nick (si es requerido)
  if (!params.nick) {
    errors.nick = "El nick es obligatorio";
  } else if (!/^[a-zA-Z0-9]+$/.test(params.nick)) {
    errors.nick = "El nick solo puede contener letras y números";
  } else if (params.nick.length < 3) {
    errors.nick = "El nick debe tener al menos tres caracteres";
  }

  // Validación del email
  if (!params.email) {
    errors.email = "El email es obligatorio";
  } else if (!params.email.includes("@")) {
    errors.email = "El email debe contener el símbolo '@'";
  }

  // Validación de la contraseña (si es requerida)
  if (params.isPassword && !validator.isLength(params.password, { min: 6 })) {
    errors.password = "La contraseña debe tener al menos 6 caracteres";
  }

  // Validación de la biografía (si es requerida)
  if (params.bio && !validator.isLength(params.bio, { max: 250 })) {
    errors.bio = "La biografía debe tener como máximo 250 caracteres";
  }

  // Verificar si hay errores
  const isValid = Object.keys(errors).length === 0;

  if (!isValid) {
    return {
      isValid: false,
      errors,
    };
  }

  return { isValid: true };
};

module.exports = {
  validateRegister,
};
