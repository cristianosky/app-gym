/**
 * Compartir la rutina vigente con otro usuario, identificado por username.
 *
 * Se manda una foto del plan tal como está en ese momento: si el remitente la
 * regenera o edita después, lo ya compartido no cambia. Al aceptar, la
 * solicitud reemplaza la rutina vigente de quien la recibe (queda guardada
 * como una fila nueva, igual que cualquier otra regeneración).
 */
import * as planRepo from '../repositories/plan.repo.js';
import * as userRepo from '../repositories/user.repo.js';
import * as shareRepo from '../repositories/routine-share.repo.js';
import { badRequest, notFound } from '../utils/app-error.js';

/** Envía la rutina vigente del remitente a otro usuario por su username. */
export function shareRoutine(fromUser, username) {
  const destino = userRepo.findByUsername(username);
  if (!destino) throw notFound('No encontramos ese usuario.');
  if (destino.id === fromUser.id) {
    throw badRequest('No puede compartir su rutina consigo mismo.');
  }

  const actual = planRepo.findCurrent('rutina', fromUser.id);
  if (!actual) throw badRequest('Todavía no tiene una rutina para compartir.');

  shareRepo.create(fromUser.id, destino.id, actual.plan);
  return { to: { username: destino.username, name: destino.name } };
}

/** Solicitudes pendientes que le han compartido a este usuario. */
export function listPendingShares(userId) {
  return shareRepo.findPendingFor(userId).map((s) => ({
    id: s.id,
    from: { username: s.fromUsername, name: s.fromName },
    createdAt: s.createdAt,
  }));
}

function solicitudPendiente(userId, shareId) {
  const solicitud = shareRepo.findById(shareId);
  if (!solicitud || solicitud.toUserId !== userId || solicitud.status !== 'pending') {
    throw notFound('Esa solicitud ya no está disponible.');
  }
  return solicitud;
}

/** Acepta la solicitud: la rutina compartida pasa a ser la vigente. */
export function acceptShare(userId, shareId) {
  const solicitud = solicitudPendiente(userId, shareId);
  const guardado = planRepo.save('rutina', userId, solicitud.plan, 'compartida');
  shareRepo.resolve(shareId, 'accepted');
  return guardado;
}

export function rejectShare(userId, shareId) {
  solicitudPendiente(userId, shareId);
  shareRepo.resolve(shareId, 'rejected');
}
