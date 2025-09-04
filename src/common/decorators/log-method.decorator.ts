import { CustomLoggerService } from '../logger/custom-logger.service';

export function LogMethod(message?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = new CustomLoggerService();
      const className = target.constructor.name;
      const logMessage = message || `${className}.${propertyName}`;
      
      const startTime = Date.now();
      
      try {
        logger.debug(`Starting ${logMessage}`, { 
          className,
          methodName: propertyName,
          args: JSON.stringify(args).substring(0, 500)
        });
        
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        logger.debug(`Completed ${logMessage}`, {
          className,
          methodName: propertyName,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error(`Failed ${logMessage}`, error.stack, {
          className,
          methodName: propertyName,
          duration,
          error: error.message
        });
        
        throw error;
      }
    };
  };
}