import asyncHandler from "express-async-handler";
import Contact from "../models/contactModel.js";
import { v4 as uuidv4 } from 'uuid';
import moment from "moment-timezone";
import SMSHistory from "../models/smsHistoryModel.js";
import { isInvalidContactSmsPayload, formatBulkContactSmsPayload, getGMTEpochTime } from "../utils/validateBulkEmailSmsContactPayload.js";



// process hourly based sms
async function processContactsSmsForHours(req, res, contactSmsPayload, scheduledDate, endDate, contactIds) {
  const batchQuantity = contactSmsPayload?.batch_schedule[0]?.batch_quantity;
 
  let filteredIds = [];
  if (batchQuantity >= contactIds?.length) {
      filteredIds = contactIds?.slice(); // take all remaining IDs
  } else {
      filteredIds = contactIds?.slice(0, batchQuantity); // take IDs based on batch quantity
  }

  // Remove the filtered IDs from the original data array
  contactIds = contactIds?.filter(id => !filteredIds?.includes(id));

  for (let item = 0; item < filteredIds?.length; item++) {
      try {
        
          // Search for requested contact
          const foundContact = await Contact.findById(filteredIds[item]);
          if (foundContact && foundContact?.organization_id === req.user.organization_id) {
            
            const data = {
              src: contactSmsPayload?.src,
              dst: foundContact?.phone,
              text: contactSmsPayload?.text,
              type: "sms",
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              send_at: scheduledDate,
              is_scheduled: scheduledDate ? true : false,
              pli_message_uuid: undefined, // as it is schedule message so storing value as undefined
              organization_id:contactSmsPayload?.organization_id,
              current_status: "queued",
              is_tried: scheduledDate ? false : true,
              is_sent: false,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }

            const scheduledSMSHistory = new SMSHistory(data);
            await scheduledSMSHistory.save();
          }
      } catch (err) {
          continue;
      }
  }

  // Increase scheduled date by repeat_after_value
  const repeatAfterValue = contactSmsPayload?.batch_schedule[0]?.repeat_after_value;
  const newScheduledDate = new Date(scheduledDate);
  newScheduledDate.setHours(newScheduledDate.getHours() + repeatAfterValue);

  // Check if scheduled date is less than end date for recursion
  if (new Date(newScheduledDate) <= endDate) {

      // Call processContactsSmsForHours recursively with updated scheduled date
      await processContactsSmsForHours(req, res, contactSmsPayload, newScheduledDate, endDate, contactIds);
  } else {
    return res.status(200).json({
      message: `Processed all contacts, successfully posted all sms.`,
  });
  }
}



// process days based sms
async function processContactsSmsForDays(req, res, contactSmsPayload, scheduledDate, endDate, contactIds) {
  const batchQuantity = contactSmsPayload?.batch_schedule[0]?.batch_quantity;

  let filteredIds = [];
  if (batchQuantity >= contactIds?.length) {
      filteredIds = contactIds?.slice(); // take all remaining IDs
  } else {
      filteredIds = contactIds?.slice(0, batchQuantity); // take IDs based on batch quantity
  }

  // Remove the filtered IDs from the original data array
  contactIds = contactIds?.filter(id => !filteredIds?.includes(id));

  for (let item = 0; item < filteredIds?.length; item++) {
      try {
        
          // Search for requested contact
          const foundContact = await Contact.findById(filteredIds[item]);
          if (foundContact && foundContact?.organization_id === req.user.organization_id) {
            
            const data = {
              src: contactSmsPayload?.src,
              dst: foundContact?.phone,
              text: contactSmsPayload?.text,
              type: "sms",
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              send_at: scheduledDate,
              is_scheduled: scheduledDate ? true : false,
              pli_message_uuid: undefined, // as it is schedule message so storing value as undefined
              organization_id:contactSmsPayload?.organization_id,
              current_status: "queued",
              is_tried: scheduledDate ? false : true,
              is_sent: false,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }

            const scheduledSMSHistory = new SMSHistory(data);
            await scheduledSMSHistory.save();
          }
      } catch (err) {
          continue;
      }
  }

  
  // Increase scheduled date by repeat_after_value
  const repeatAfterValue = contactSmsPayload?.batch_schedule[0]?.repeat_after_value;
  const newScheduledDate = new Date(scheduledDate);
  newScheduledDate.setDate(newScheduledDate.getDate() + repeatAfterValue);
  
  
  // Check if scheduled date is less than end date for recursion
  if (new Date(newScheduledDate) <= endDate) {

      // Call processContactsSmsForDays recursively with updated scheduled date
      await processContactsSmsForDays(req, res, contactSmsPayload, newScheduledDate, endDate, contactIds);
  } else {
    return res.status(200).json({
      message: `Processed all contacts, successfully posted all sms.`,
  });
  }
}

// process monthly based sms
async function processContactsSmsForMonth(req, res, contactSmsPayload, scheduledDate, endDate, contactIds) {
  const batchQuantity = contactSmsPayload?.batch_schedule[0]?.batch_quantity;
  
  let filteredIds = [];
  if (batchQuantity >= contactIds?.length) {
      filteredIds = contactIds?.slice(); // take all remaining IDs
  } else {
      filteredIds = contactIds?.slice(0, batchQuantity); // take IDs based on batch quantity
  }

  // Remove the filtered IDs from the original data array
  contactIds = contactIds?.filter(id => !filteredIds?.includes(id));

  for (let item = 0; item < filteredIds?.length; item++) {
      try {
        
          // Search for requested contact
          const foundContact = await Contact.findById(filteredIds[item]);
          if (foundContact && foundContact?.organization_id === req.user.organization_id) {
            
            const data = {
              src: contactSmsPayload?.src,
              dst: foundContact?.phone,
              text: contactSmsPayload?.text,
              type: "sms",
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              send_at: scheduledDate,
              is_scheduled: scheduledDate ? true : false,
              pli_message_uuid: undefined, // as it is schedule message so storing value as undefined
              organization_id:contactSmsPayload?.organization_id,
              current_status: "queued",
              is_tried: scheduledDate ? false : true,
              is_sent: false,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }

            const scheduledSMSHistory = new SMSHistory(data);
            await scheduledSMSHistory.save();
          }
      } catch (err) {
          continue;
      }
  }

  
  // Increase scheduled date by repeat_after_value
  const repeatAfterValue = contactSmsPayload?.batch_schedule[0]?.repeat_after_value;
  const newScheduledDate = new Date(scheduledDate);
  newScheduledDate.setMonth(newScheduledDate.getMonth() + repeatAfterValue);

  // Check if scheduled date is less than end date for recursion
  if (new Date(newScheduledDate) <= endDate) {
    
      // Call processContactsSmsForMonth recursively with updated scheduled date
      await processContactsSmsForMonth(req, res, contactSmsPayload, newScheduledDate, endDate, contactIds);
  } else {
    return res.status(200).json({
      message: `Processed all contacts, successfully posted all sms.`,
  });
  }
}

// Add Contact Sms
export const addBulkContactSms = asyncHandler(async (req, res) => {

    // Check if any empty value is passed in
    const errorMessage = isInvalidContactSmsPayload(req.body);
  
    if (errorMessage) {
      // if so, send the error message with 400
      return res.status(400).json({ message: errorMessage });
    }
  
    // format contact payload from the request
    const contactSmsPayload = formatBulkContactSmsPayload(req);

    if(contactSmsPayload?.operation_type === 'Add all at once'){

      for(let item=0; item < contactSmsPayload?.contact_id_array?.length; item = item + 1) {
        try {
            // Search for requested contact
            const foundContact = await Contact.findById(contactSmsPayload?.contact_id_array[item]);
            if (foundContact && foundContact?.organization_id === req.user.organization_id) {

            const data = {
              src: contactSmsPayload?.src,
              dst: foundContact?.phone,
              text: contactSmsPayload?.text,
              type: "sms",
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              send_at: contactSmsPayload?.scheduled_date_time,
              is_scheduled: contactSmsPayload?.scheduled_date_time ? true : false,
              pli_message_uuid: undefined, // as it is schedule message so storing value as undefined
              organization_id:contactSmsPayload?.organization_id,
              current_status: "queued",
              is_tried: contactSmsPayload?.scheduled_date_time ? false : true,
              is_sent: false,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }

            const scheduledSMSHistory = new SMSHistory(data);
            await scheduledSMSHistory.save();
          }
        } catch (err) {
          continue;
        }
     }

     return res.status(200).json({
      message: `Processed all contacts, successfully posted all sms.`,
    });

    } else if(contactSmsPayload?.operation_type === 'Add all at schedule time') {

      for (let item=0; item < contactSmsPayload?.contact_id_array?.length; item = item + 1) {
        try {
          // Search for requested contact
          const foundContact = await Contact.findById(contactSmsPayload?.contact_id_array[item]);
          if (foundContact && foundContact?.organization_id === req.user.organization_id) {
            
            const data = {
              src: contactSmsPayload?.src,
              dst: foundContact?.phone,
              text: contactSmsPayload?.text,
              type: "sms",
              inbound: false,
              recipient: {
                first_name: foundContact.first_name,
              },
              sender: {
                sender_id: req.user.id,
                first_name: req.user.first_name,
                is_active: req.user.is_active,
                profile_pic_url: req.user?.profile_pic_url ?? undefined,
              },
              send_at: contactSmsPayload?.scheduled_date_time,
              is_scheduled: contactSmsPayload?.scheduled_date_time ? true : false,
              pli_message_uuid: undefined, // as it is schedule message so storing value as undefined
              organization_id:contactSmsPayload?.organization_id,
              current_status: "queued",
              is_tried: contactSmsPayload?.scheduled_date_time ? false : true,
              is_sent: false,
              batch_id: `CALYSTRA-PRO${uuidv4()}`,
              created_at: moment().tz("Etc/UTC"),
              updated_at: moment().tz("Etc/UTC"),
            }
           
            const scheduledSMSHistory = new SMSHistory(data);
            await scheduledSMSHistory.save();
        }
      } catch (err) {
          continue;
        }
     }

     return res.status(200).json({
      message: `Processed all contacts, successfully posted all sms.`,
    });

    } else if (contactSmsPayload?.operation_type === 'Add in drip mode') {
      if(contactSmsPayload?.batch_schedule[0]?.repeat_after_type === "hours"){
       
        const startDateFromPayload = contactSmsPayload?.batch_schedule[0]?.start_date_time;
        let scheduledDate = new Date(getGMTEpochTime({
          send_at: startDateFromPayload
        }) * 1000);

        const lastDateFromPayload = contactSmsPayload?.batch_schedule[0]?.end_date_time
        const endDate = new Date(getGMTEpochTime({
          send_at: lastDateFromPayload
        }) * 1000);

        const contactIds = contactSmsPayload?.contact_id_array;
        if (new Date(scheduledDate) <= endDate && contactIds?.length > 0) {
            
            await processContactsSmsForHours(req, res, contactSmsPayload, scheduledDate, endDate, contactIds);
        } else {

            return res.status(200).json({
              message: "Scheduled date exceeds end date or no contacts available.",
          });
        }

      }

      if(contactSmsPayload?.batch_schedule[0]?.repeat_after_type === "days"){
        
        const startDateFromPayload = contactSmsPayload?.batch_schedule[0]?.start_date_time;
        let scheduledDate = new Date(getGMTEpochTime({
          send_at: startDateFromPayload
        }) * 1000);

        const lastDateFromPayload = contactSmsPayload?.batch_schedule[0]?.end_date_time
        const endDate = new Date(getGMTEpochTime({
          send_at: lastDateFromPayload
        }) * 1000);

        const contactIds = contactSmsPayload?.contact_id_array;
    
        if (new Date(scheduledDate) <= endDate && contactIds?.length > 0) {
            
            await processContactsSmsForDays(req, res, contactSmsPayload, scheduledDate, endDate, contactIds);
        } else {

            return res.status(200).json({
              message: "Scheduled date exceeds end date or no contacts available.",
          });
        }
      }
      
      
      if(contactSmsPayload?.batch_schedule[0]?.repeat_after_type === "months"){
        
        const startDateFromPayload = contactSmsPayload?.batch_schedule[0]?.start_date_time;
        let scheduledDate = new Date(getGMTEpochTime({
          send_at: startDateFromPayload
        }) * 1000);

        const lastDateFromPayload = contactSmsPayload?.batch_schedule[0]?.end_date_time
        const endDate = new Date(getGMTEpochTime({
          send_at: lastDateFromPayload
        }) * 1000);

        const contactIds = contactSmsPayload?.contact_id_array;
    
        if (new Date(scheduledDate) <= endDate && contactIds?.length > 0) {
            
            await processContactsSmsForMonth(req, res, contactSmsPayload, scheduledDate, endDate, contactIds);
        } else {
          return res.status(200).json({
            message: "Scheduled date exceeds end date or no contacts available.",
        });
        }
      }
      
      
    } else {
      return res.status(200).json({
        messages: "Operation type are not matched with any operations.",
      });
    }
});