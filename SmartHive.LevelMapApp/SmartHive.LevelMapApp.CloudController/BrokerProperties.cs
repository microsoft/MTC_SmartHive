//---------------------------------------------------------------------------------
// Copyright (c) 2014, Microsoft Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//---------------------------------------------------------------------------------

using System;
using System.Globalization;
using System.Runtime.Serialization;

namespace SmartHive.LevelMapApp.CloudController
{
    [DataContract]
    class BrokerProperties
    {
        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.CorrelationId' is never assigned to, and will always have its default value null
        public string CorrelationId;
#pragma warning restore CS0649 // Field 'BrokerProperties.CorrelationId' is never assigned to, and will always have its default value null

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.SessionId' is never assigned to, and will always have its default value null
        public string SessionId;
#pragma warning restore CS0649 // Field 'BrokerProperties.SessionId' is never assigned to, and will always have its default value null

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.DeliveryCount' is never assigned to, and will always have its default value
        public int? DeliveryCount;
#pragma warning restore CS0649 // Field 'BrokerProperties.DeliveryCount' is never assigned to, and will always have its default value

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.LockToken' is never assigned to, and will always have its default value
        public Guid? LockToken;
#pragma warning restore CS0649 // Field 'BrokerProperties.LockToken' is never assigned to, and will always have its default value

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.MessageId' is never assigned to, and will always have its default value null
        public string MessageId;
#pragma warning restore CS0649 // Field 'BrokerProperties.MessageId' is never assigned to, and will always have its default value null

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.Label' is never assigned to, and will always have its default value null
        public string Label;
#pragma warning restore CS0649 // Field 'BrokerProperties.Label' is never assigned to, and will always have its default value null

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.ReplyTo' is never assigned to, and will always have its default value null
        public string ReplyTo;
#pragma warning restore CS0649 // Field 'BrokerProperties.ReplyTo' is never assigned to, and will always have its default value null

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.SequenceNumber' is never assigned to, and will always have its default value
        public long? SequenceNumber;
#pragma warning restore CS0649 // Field 'BrokerProperties.SequenceNumber' is never assigned to, and will always have its default value

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.To' is never assigned to, and will always have its default value null
        public string To;
#pragma warning restore CS0649 // Field 'BrokerProperties.To' is never assigned to, and will always have its default value null

        public DateTime? LockedUntilUtcDateTime;

        [DataMember(EmitDefaultValue = false)]
        public string LockedUntilUtc
        {
            get
            {
                if (LockedUntilUtcDateTime != null && LockedUntilUtcDateTime.HasValue)
                {
                    return LockedUntilUtcDateTime.Value.ToString("R", CultureInfo.InvariantCulture);
                }

                return null;
            }
            set
            {
                try
                {
                    LockedUntilUtcDateTime = DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
                }
                catch
                {
                }
            }
        }

        public DateTime? ScheduledEnqueueTimeUtcDateTime;

        [DataMember(EmitDefaultValue = false)]
        public string ScheduledEnqueueTimeUtc
        {
            get
            {
                if (ScheduledEnqueueTimeUtcDateTime != null && ScheduledEnqueueTimeUtcDateTime.HasValue)
                {
                    return ScheduledEnqueueTimeUtcDateTime.Value.ToString("R", CultureInfo.InvariantCulture);
                }

                return null;
            }
            set
            {
                try
                {
                    ScheduledEnqueueTimeUtcDateTime = DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
                }
                catch
                {
                }
            }
        }

        public TimeSpan? TimeToLiveTimeSpan;

        [DataMember(EmitDefaultValue = false)]
        public double TimeToLive
        {
            get
            {
                if (TimeToLiveTimeSpan != null && TimeToLiveTimeSpan.HasValue)
                {
                    return TimeToLiveTimeSpan.Value.TotalSeconds;
                }
                return 0;
            }
            set
            {
                // This is needed as TimeSpan.FromSeconds(TimeSpan.MaxValue.TotalSeconds) throws Overflow exception.
                if (TimeSpan.MaxValue.TotalSeconds == value)
                {
                    TimeToLiveTimeSpan = TimeSpan.MaxValue;
                }
                else
                {
                    TimeToLiveTimeSpan = TimeSpan.FromSeconds(value);
                }
            }
        }

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.ReplyToSessionId' is never assigned to, and will always have its default value null
        public string ReplyToSessionId;
#pragma warning restore CS0649 // Field 'BrokerProperties.ReplyToSessionId' is never assigned to, and will always have its default value null

/*        public MessageState StateEnum;

        [DataMember(EmitDefaultValue = false)]
        public string State
        {
            get { return StateEnum.ToString(); }

            internal set { StateEnum = (MessageState)Enum.Parse(typeof(MessageState), value); }
        }*/

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.EnqueuedSequenceNumber' is never assigned to, and will always have its default value
        public long? EnqueuedSequenceNumber;
#pragma warning restore CS0649 // Field 'BrokerProperties.EnqueuedSequenceNumber' is never assigned to, and will always have its default value

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.PartitionKey' is never assigned to, and will always have its default value null
        public string PartitionKey;
#pragma warning restore CS0649 // Field 'BrokerProperties.PartitionKey' is never assigned to, and will always have its default value null

        public DateTime? EnqueuedTimeUtcDateTime;

        [DataMember(EmitDefaultValue = false)]
        public string EnqueuedTimeUtc
        {
            get
            {
                if (EnqueuedTimeUtcDateTime != null && EnqueuedTimeUtcDateTime.HasValue)
                {
                    return EnqueuedTimeUtcDateTime.Value.ToString("R", CultureInfo.InvariantCulture);
                }

                return null;
            }
            set
            {
                try
                {
                    EnqueuedTimeUtcDateTime = DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
                }
                catch
                {
                }
            }
        }

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.ViaPartitionKey' is never assigned to, and will always have its default value null
        public string ViaPartitionKey;
#pragma warning restore CS0649 // Field 'BrokerProperties.ViaPartitionKey' is never assigned to, and will always have its default value null

        [DataMember(EmitDefaultValue = false)]
#pragma warning disable CS0649 // Field 'BrokerProperties.ForcePersistence' is never assigned to, and will always have its default value
        public bool? ForcePersistence;
#pragma warning restore CS0649 // Field 'BrokerProperties.ForcePersistence' is never assigned to, and will always have its default value
    }
}